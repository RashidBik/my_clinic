import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
	createMessage,
	listMessages,
	editMessage,
	ChatError
} from '../services/chat.js';

// ═══════════════════════════════════════════════
// Schemas
// ═══════════════════════════════════════════════

const ListQuerySchema = z.object({
	limit: z.coerce.number().min(1).max(100).default(50),
	before: z.string().datetime().optional()
});

const CreateMessageSchema = z.object({
	content: z.string().min(1).max(2000),
	messageType: z.enum(['normal', 'operational']).default('normal'),
	recordId: z.string().optional(),
	templateId: z.string().optional(),
	templateData: z.record(z.unknown()).optional(),
	clientOperationId: z.string().uuid().optional()
});

const EditMessageSchema = z.object({
	content: z.string().min(1).max(2000)
});

// ═══════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════

const chatRoutes: FastifyPluginAsync = async (app) => {
	// همه Routeها نیاز به Auth دارند
	app.addHook('preHandler', app.authenticate);
	
	// ─────────────────────────────────────────────
	// GET /api/chat/messages
	// ─────────────────────────────────────────────
	app.get('/chat/messages', async (request, reply) => {
		const query = ListQuerySchema.safeParse(request.query);
		
		if (!query.success) {
			return reply.status(400).send({
				error: 'ValidationError',
				message: 'پارامترهای نامعتبر',
				details: query.error.flatten().fieldErrors
			});
		}
		
		const result = await listMessages({
			organizationId: request.user!.orgId,
			limit: query.data.limit,
			before: query.data.before ? new Date(query.data.before) : undefined
		});
		
		return result;
	});
	
	// ─────────────────────────────────────────────
	// POST /api/chat/messages
	// ─────────────────────────────────────────────
	app.post('/chat/messages', async (request, reply) => {
		const body = CreateMessageSchema.safeParse(request.body);
		
		if (!body.success) {
			return reply.status(400).send({
				error: 'ValidationError',
				message: 'اطلاعات نامعتبر',
				details: body.error.flatten().fieldErrors
			});
		}
		
		try {
			const message = await createMessage({
				organizationId: request.user!.orgId,
				senderId: request.user!.sub,
				content: body.data.content,
				messageType: body.data.messageType,
				recordId: body.data.recordId,
				templateId: body.data.templateId,
				templateData: body.data.templateData
			});
			
			// Broadcast via Socket.io
			app.io?.to(`org:${request.user!.orgId}`).emit('chat:new', message);
			
			return reply.status(201).send(message);
		} catch (error) {
			if (error instanceof ChatError) {
				return reply.status(error.statusCode).send({
					error: error.code,
					message: error.message
				});
			}
			throw error;
		}
	});
	
	// ─────────────────────────────────────────────
	// PATCH /api/chat/messages/:id
	// ─────────────────────────────────────────────
	app.patch<{ Params: { id: string } }>(
		'/chat/messages/:id',
		async (request, reply) => {
			const body = EditMessageSchema.safeParse(request.body);
			
			if (!body.success) {
				return reply.status(400).send({
					error: 'ValidationError',
					message: 'اطلاعات نامعتبر',
					details: body.error.flatten().fieldErrors
				});
			}
			
			try {
				const message = await editMessage(
					request.params.id,
					request.user!.sub,
					body.data.content
				);
				
				// Broadcast
				app.io?.to(`org:${request.user!.orgId}`).emit('chat:updated', message);
				
				return message;
			} catch (error) {
				if (error instanceof ChatError) {
					return reply.status(error.statusCode).send({
						error: error.code,
						message: error.message
					});
				}
				throw error;
			}
		}
	);
};

export default chatRoutes;