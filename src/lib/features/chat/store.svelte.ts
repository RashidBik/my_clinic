import { io, type Socket } from 'socket.io-client';
import { auth } from '$lib/stores/auth.svelte';
import { api } from '$lib/api/client';
import type { ChatMessage, TypingUser } from './types';
import { config } from '$lib/config';
import { generateUUID } from '$lib/utils/uuid';

// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════

interface ChatState {
	messages: ChatMessage[];
	hasMore: boolean;
	isLoading: boolean;
	isLoadingMore: boolean;
	isSending: boolean;
	connectionStatus: 'connecting' | 'connected' | 'disconnected';
	typingUsers: Map<string, TypingUser>;
	editingMessageId: string | null;
}

const state = $state<ChatState>({
	messages: [],
	hasMore: false,
	isLoading: false,
	isLoadingMore: false,
	isSending: false,
	connectionStatus: 'connecting',
	typingUsers: new Map(),
	editingMessageId: null
});

let socket: Socket | null = null;
let typingTimeout: ReturnType<typeof setTimeout> | null = null;

// ═══════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════

export const chat = {
	// Getters
	get messages() { return state.messages; },
	get hasMore() { return state.hasMore; },
	get isLoading() { return state.isLoading; },
	get isLoadingMore() { return state.isLoadingMore; },
	get isSending() { return state.isSending; },
	get connectionStatus() { return state.connectionStatus; },
	get typingUsers() { return Array.from(state.typingUsers.values()); },
	get editingMessageId() { return state.editingMessageId; },

	// ═══════════════════════════════════════════════
	// Init
	// ═══════════════════════════════════════════════
	async init(): Promise<void> {
		if (!auth.accessToken) return;

		// ۱. Load messages
		await this.loadInitial();

		// ۲. Setup Socket
		this.setupSocket();
	},

	// ═══════════════════════════════════════════════
	// Load
	// ═══════════════════════════════════════════════
	async loadInitial(): Promise<void> {
		state.isLoading = true;
		try {
			const result = await api.get<{ messages: ChatMessage[]; hasMore: boolean }>(
				'/chat/messages?limit=50'
			);
			// API جدیدترین‌ها را اول می‌دهد → reverse
			state.messages = result.messages.reverse();
			state.hasMore = result.hasMore;
		} finally {
			state.isLoading = false;
		}
	},

	async loadMore(): Promise<void> {
		if (state.isLoadingMore || !state.hasMore || state.messages.length === 0) return;

		state.isLoadingMore = true;
		try {
			const oldest = state.messages[0]!;
			const result = await api.get<{ messages: ChatMessage[]; hasMore: boolean }>(
				`/chat/messages?limit=50&before=${encodeURIComponent(oldest.createdAt)}`
			);

			// پیام‌های قدیمی‌تر را به ابتدای لیست اضافه کن
			state.messages = [...result.messages.reverse(), ...state.messages];
			state.hasMore = result.hasMore;
		} finally {
			state.isLoadingMore = false;
		}
	},

	// ═══════════════════════════════════════════════
	// Send (Optimistic)
	// ═══════════════════════════════════════════════
	async send(content: string): Promise<void> {
		const trimmed = content.trim();
		if (!trimmed) return;

		const clientOperationId = generateUUID();

		// ۱. Optimistic Message
		const optimistic: ChatMessage = {
			id: `temp-${clientOperationId}`,
			organizationId: auth.organization!.id,
			senderId: auth.user!.id,
			senderName: auth.user!.name,
			senderAvatar: auth.user!.avatar,
			messageType: 'normal',
			content: trimmed,
			recordId: null,
			templateId: null,
			templateData: null,
			editedAt: null,
			createdAt: new Date().toISOString(),
			status: 'pending',
			clientOperationId
		};

		state.messages = [...state.messages, optimistic];
		state.isSending = true;

		try {
			const created = await api.post<ChatMessage>('/chat/messages', {
				content: trimmed,
				clientOperationId
			});

			// جایگزین Optimistic با واقعی
			state.messages = state.messages.map((m) =>
				m.id === optimistic.id ? { ...created, status: 'sent' } : m
			);
		} catch (err) {
			// علامت‌گذاری به عنوان Failed
			state.messages = state.messages.map((m) =>
				m.id === optimistic.id ? { ...m, status: 'failed' } : m
			);
			throw err;
		} finally {
			state.isSending = false;
		}
	},

	// ═══════════════════════════════════════════════
	// Edit
	// ═══════════════════════════════════════════════
	startEdit(messageId: string) {
		state.editingMessageId = messageId;
	},

	cancelEdit() {
		state.editingMessageId = null;
	},

	async saveEdit(messageId: string, content: string): Promise<void> {
		const trimmed = content.trim();
		if (!trimmed) return;

		try {
			await api.patch(`/chat/messages/${messageId}`, { content: trimmed });
			// Socket `chat:updated` خودکار می‌آید
			state.editingMessageId = null;
		} catch (err) {
			console.error('Edit failed:', err);
			throw err;
		}
	},

	canEdit(message: ChatMessage): boolean {
		if (message.senderId !== auth.user?.id) return false;
		if (message.messageType !== 'normal') return false;
		const elapsed = Date.now() - new Date(message.createdAt).getTime();
		return elapsed < 60 * 1000; // ۱ دقیقه
	},

	// ═══════════════════════════════════════════════
	// Typing
	// ═══════════════════════════════════════════════
	notifyTyping() {
		if (!socket?.connected) return;

		socket.emit('chat:typing', { isTyping: true });

		// Debounce: بعد از ۲ ثانیه سکوت، isTyping = false
		if (typingTimeout) clearTimeout(typingTimeout);
		typingTimeout = setTimeout(() => {
			socket?.emit('chat:typing', { isTyping: false });
		}, 2000);
	},

	// ═══════════════════════════════════════════════
	// Socket
	// ═══════════════════════════════════════════════
	setupSocket() {
		if (socket) return;

		socket = io(config.apiUrl.replace('/api', ''), {
			auth: { token: auth.accessToken },
			path: '/socket.io',
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			reconnectionAttempts: Infinity
		});

		socket.on('connect', () => {
			state.connectionStatus = 'connected';
		});

		socket.on('disconnect', () => {
			state.connectionStatus = 'disconnected';
		});

		socket.on('connect_error', () => {
			state.connectionStatus = 'disconnected';
		});

		socket.on('chat:new', (message: ChatMessage) => {
			// اگر پیام خودمان است و از Optimistic آمده، skip
			const existing = state.messages.find(
				(m) => m.clientOperationId && m.clientOperationId === message.id
			);
			if (existing) return;

			state.messages = [...state.messages, message];
		});

		socket.on('chat:updated', (message: ChatMessage) => {
			state.messages = state.messages.map((m) =>
				m.id === message.id ? message : m
			);
		});

		socket.on('chat:typing', (data: { userId: string; roleSlug: string; isTyping: boolean }) => {
			if (data.userId === auth.user?.id) return; // خودمان

			const newMap = new Map(state.typingUsers);
			if (data.isTyping) {
				newMap.set(data.userId, data);
			} else {
				newMap.delete(data.userId);
			}
			state.typingUsers = newMap;
		});
	},

	disconnect() {
		socket?.disconnect();
		socket = null;
		state.messages = [];
		state.typingUsers = new Map();
		state.connectionStatus = 'connecting';
	}
};