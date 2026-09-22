import { db } from '../db/client.js';
import { chatMessages } from '../db/schema/chat.js';
import { users } from '../db/schema/core.js';
import { eq, and, lt, desc, sql, inArray } from 'drizzle-orm';
import { roles } from '../db/schema/core.js';


// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface ChatMessage {
	id: string;
	organizationId: string;
	senderId: string;
	senderName: string;
	senderAvatar: string | null;
	messageType: 'normal' | 'operational' | 'system';
	content: string;
	recordId: string | null;
	templateId: string | null;
	templateData: Record<string, unknown> | null;
		// ⭐ جدید
	nextRoleId: string | null;
	nextRoleName: string | null;
	nextRoleSlug: string | null;
	recordStatus: string | null;
	referenceCode: string | null;
	editedAt: Date | null;
	createdAt: Date;
}

export interface CreateMessageInput {
	organizationId: string;
	senderId: string;
	content: string;
	messageType?: 'normal' | 'operational' | 'system';
	recordId?: string;
	templateId?: string;
	templateData?: Record<string, unknown>;
}

export interface ListMessagesOptions {
	organizationId: string;
	limit?: number;
	before?: Date; // Pagination cursor
}

// ═══════════════════════════════════════════════
// Create
// ═══════════════════════════════════════════════

export async function createMessage(input: CreateMessageInput): Promise<ChatMessage> {
	const [created] = await db
		.insert(chatMessages)
		.values({
			organizationId: input.organizationId,
			senderId: input.senderId,
			messageType: input.messageType ?? 'normal',
			content: input.content,
			recordId: input.recordId,
			templateId: input.templateId,
			templateData: input.templateData
		})
		.returning();
	
	if (!created) {
		throw new Error('Failed to create message');
	}
	
	// Join with users for sender info
	const [sender] = await db
		.select({
			name: users.name,
			avatar: users.avatar
		})
		.from(users)
		.where(eq(users.id, created.senderId))
		.limit(1);
		// ⭐ Join nextRole
		let nextRoleName: string | null = null;
		let nextRoleSlug: string | null = null;

		if (created.nextRoleId) {
			const [role] = await db
				.select({ name: roles.name, slug: roles.slug })
				.from(roles)
				.where(eq(roles.id, created.nextRoleId))
				.limit(1);

			nextRoleName = role?.name ?? null;
			nextRoleSlug = role?.slug ?? null;
		}

	return {
		id: created.id,
		organizationId: created.organizationId,
		senderId: created.senderId,
		senderName: sender?.name ?? 'نامشخص',
		senderAvatar: sender?.avatar ?? null,
		messageType: created.messageType as ChatMessage['messageType'],
		content: created.content,
		recordId: created.recordId,
		templateId: created.templateId,
		templateData: created.templateData as Record<string, unknown> | null,
		nextRoleId: created.nextRoleId,
		nextRoleName,
		nextRoleSlug,
		recordStatus: created.recordStatus,
		referenceCode: created.referenceCode,
		editedAt: created.editedAt,
		createdAt: created.createdAt
	};
}

// ═══════════════════════════════════════════════
// List (Paginated)
// ═══════════════════════════════════════════════

export async function listMessages(options: ListMessagesOptions): Promise<{
	messages: ChatMessage[];
	hasMore: boolean;
}> {
	const limit = Math.min(options.limit ?? 50, 100);
	
	// Query با Cursor
	const conditions = [eq(chatMessages.organizationId, options.organizationId)];
	
	if (options.before) {
		conditions.push(lt(chatMessages.createdAt, options.before));
	}
	
	const rows = await db
		.select({
			message: chatMessages,
			senderName: users.name,
			senderAvatar: users.avatar
		})
		.from(chatMessages)
		.innerJoin(users, eq(chatMessages.senderId, users.id))
		.where(and(...conditions))
		.orderBy(desc(chatMessages.createdAt))
		.limit(limit + 1); // +1 برای تشخیص hasMore

			// ⭐ Load همه Roleهای مربوطه در یک Query
	const roleIds = rows
		.map((r) => r.message.nextRoleId)
		.filter((id): id is string => id !== null);

	const roleMap = new Map<string, { name: string; slug: string }>();
	if (roleIds.length > 0) {
		const roleRows = await db
			.select({ id: roles.id, name: roles.name, slug: roles.slug })
			.from(roles)
			.where(inArray(roles.id, roleIds));

		for (const r of roleRows) {
			roleMap.set(r.id, { name: r.name, slug: r.slug });
		}
	}
	
	const hasMore = rows.length > limit;
	const items = rows.slice(0, limit);
	
	const messages: ChatMessage[] = items.map((row) => {
		const nextRole = row.message.nextRoleId
			? roleMap.get(row.message.nextRoleId)
			: null;

		return {

			id: row.message.id,
			organizationId: row.message.organizationId,
			senderId: row.message.senderId,
			senderName: row.senderName,
			senderAvatar: row.senderAvatar,
			messageType: row.message.messageType as ChatMessage['messageType'],
			content: row.message.content,
			recordId: row.message.recordId,
			templateId: row.message.templateId,
			templateData: row.message.templateData as Record<string, unknown> | null,
			editedAt: row.message.editedAt,
			createdAt: row.message.createdAt,
			// ... قبلی
			nextRoleId: row.message.nextRoleId,
			nextRoleName: nextRole?.name ?? null,
			nextRoleSlug: nextRole?.slug ?? null,
			recordStatus: row.message.recordStatus,
			referenceCode: row.message.referenceCode
		};
	});
	
	return { messages, hasMore };
}

// ═══════════════════════════════════════════════
// Edit (با ۱ دقیقه محدودیت)
// ═══════════════════════════════════════════════

const EDIT_WINDOW_MS = 60 * 1000; // ۱ دقیقه

export async function editMessage(
	messageId: string,
	userId: string,
	content: string
): Promise<ChatMessage> {
	const [existing] = await db
		.select()
		.from(chatMessages)
		.where(eq(chatMessages.id, messageId))
		.limit(1);
	
	if (!existing) {
		throw new ChatError('NOT_FOUND', 'پیام یافت نشد', 404);
	}
	
	if (existing.senderId !== userId) {
		throw new ChatError('FORBIDDEN', 'فقط فرستنده می‌تواند ویرایش کند', 403);
	}
	
	if (existing.messageType !== 'normal') {
		throw new ChatError('NOT_EDITABLE', 'پیام عملیاتی قابل ویرایش نیست', 403);
	}
	
	const elapsed = Date.now() - existing.createdAt.getTime();
	if (elapsed > EDIT_WINDOW_MS) {
		throw new ChatError('EDIT_WINDOW_EXPIRED', 'زمان ویرایش منقضی شده است', 403);
	}
	
	const [updated] = await db
		.update(chatMessages)
		.set({
			content,
			editedAt: new Date()
		})
		.where(eq(chatMessages.id, messageId))
		.returning();
	
	if (!updated) {
		throw new ChatError('UPDATE_FAILED', 'ویرایش ناموفق', 500);
	}
	
	const [sender] = await db
		.select({ name: users.name, avatar: users.avatar })
		.from(users)
		.where(eq(users.id, updated.senderId))
		.limit(1);
	
	return {
		id: updated.id,
		organizationId: updated.organizationId,
		senderId: updated.senderId,
		senderName: sender?.name ?? 'نامشخص',
		senderAvatar: sender?.avatar ?? null,
		messageType: updated.messageType as ChatMessage['messageType'],
		content: updated.content,
		recordId: updated.recordId,
		templateId: updated.templateId,
		templateData: updated.templateData as Record<string, unknown> | null,
		nextRoleId: updated.nextRoleId,
		nextRoleName: null,
		nextRoleSlug: null,
		recordStatus: updated.recordStatus,
		referenceCode: updated.referenceCode,
		editedAt: updated.editedAt,
		createdAt: updated.createdAt
	};
}

// ═══════════════════════════════════════════════
// Errors
// ═══════════════════════════════════════════════

export class ChatError extends Error {
	constructor(
		public code: string,
		message: string,
		public statusCode = 400
	) {
		super(message);
		this.name = 'ChatError';
	}
}

// ═══════════════════════════════════════════════
// Get Single Message (for Broadcast)
// ═══════════════════════════════════════════════

export async function getChatMessage(messageId: string): Promise<ChatMessage | null> {
	const [row] = await db
		.select({
			message: chatMessages,
			senderName: users.name,
			senderAvatar: users.avatar
		})
		.from(chatMessages)
		.innerJoin(users, eq(chatMessages.senderId, users.id))
		.where(eq(chatMessages.id, messageId))
		.limit(1);

	if (!row) return null;

	return {
		id: row.message.id,
		organizationId: row.message.organizationId,
		senderId: row.message.senderId,
		senderName: row.senderName,
		senderAvatar: row.senderAvatar,
		messageType: row.message.messageType as ChatMessage['messageType'],
		content: row.message.content,
		recordId: row.message.recordId,
		templateId: row.message.templateId,
		templateData: row.message.templateData as Record<string, unknown> | null,
		nextRoleId: row.message.nextRoleId,
		nextRoleName: null,
		nextRoleSlug: null,
		recordStatus: row.message.recordStatus,
		referenceCode: row.message.referenceCode,
		editedAt: row.message.editedAt,
		createdAt: row.message.createdAt
	};
}