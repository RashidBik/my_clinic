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
	editedAt: string | null;
	createdAt: string;

	// Client-only
	status?: 'pending' | 'sent' | 'failed';
	clientOperationId?: string;
}

export interface TypingUser {
	userId: string;
	roleSlug: string;
	isTyping: boolean;
}