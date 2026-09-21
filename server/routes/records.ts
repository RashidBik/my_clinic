import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { executeTemplate, continueRecord, TemplateError } from '../services/template-engine.js';
import { listRecords, getRecord } from '../services/records.js';
import { getChatMessage } from '../services/chat.js';

// ═══════════════════════════════════════════════
// Schemas
// ═══════════════════════════════════════════════

const ExecuteTemplateSchema = z.object({
	templateId: z.string().min(1),
	data: z.record(z.string(), z.unknown()),
	clientOperationId: z.string().uuid()
});

const ContinueRecordSchema = z.object({
	templateId: z.string().min(1),
	data: z.record(z.string(), z.unknown()),
	clientOperationId: z.string().uuid()
});

const ListQuerySchema = z.object({
	limit: z.coerce.number().min(1).max(100).default(50),
	status: z.enum(['waiting', 'in_progress', 'completed', 'cancelled']).optional()
});

type AuthenticatedUser = {
	orgId: string;
	sub: string;
	roleId: string;
	baseRole: string;
};

// ═══════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════

const recordsRoutes: FastifyPluginAsync = async (app) => {
	app.addHook('preHandler', app.authenticate);

	// ─────────────────────────────────────────────
	// POST /api/records/execute
	// ─────────────────────────────────────────────
	app.post('/records/execute', async (request, reply) => {
		const user = request.user as AuthenticatedUser;
		const body = ExecuteTemplateSchema.safeParse(request.body);

		if (!body.success) {
			return reply.status(400).send({
				error: 'ValidationError',
				message: 'اطلاعات نامعتبر',
				details: body.error.flatten().fieldErrors
			});
		}

		try {
			const result = await executeTemplate({
				organizationId: user.orgId,
				userId: user.sub,
				templateId: body.data.templateId,
				data: body.data.data,
				clientOperationId: body.data.clientOperationId
			});

			// ⭐ Broadcast Record Created
			app.io
				?.to(`org:${user.orgId}`)
				.emit('record:created', result);

			// ⭐ Broadcast Chat Message (کامل)
			const fullMessage = await getChatMessage(result.chatMessageId);
			if (fullMessage) {
				app.io
					?.to(`org:${user.orgId}`)
					.emit('chat:new', fullMessage);
			}

			return reply.status(201).send(result);
		} catch (error) {
			if (error instanceof TemplateError) {
				return reply.status(error.statusCode).send({
					error: error.code,
					message: error.message
				});
			}
			throw error;
		}
	});

	// ─────────────────────────────────────────────
	// POST /api/records/:id/continue
	// ─────────────────────────────────────────────
	app.post<{ Params: { id: string } }>(
		'/records/:id/continue',
		async (request, reply) => {
			const user = request.user as AuthenticatedUser;
			const body = ContinueRecordSchema.safeParse(request.body);

			if (!body.success) {
				return reply.status(400).send({
					error: 'ValidationError',
					message: 'اطلاعات نامعتبر',
					details: body.error.flatten().fieldErrors
				});
			}

			try {
				const result = await continueRecord({
					organizationId: user.orgId,
					userId: user.sub,
					roleId: user.roleId,
					baseRole: user.baseRole,
					recordId: request.params.id,
					templateId: body.data.templateId,
					data: body.data.data,
					clientOperationId: body.data.clientOperationId
				});

				// ⭐ Broadcast Record Updated
				app.io
					?.to(`org:${user.orgId}`)
					.emit('record:updated', {
						recordId: request.params.id,
						result
					});

				// ⭐ Broadcast Chat Message (کامل)
				const fullMessage = await getChatMessage(result.chatMessageId);
				if (fullMessage) {
					app.io
						?.to(`org:${user.orgId}`)
						.emit('chat:new', fullMessage);
				}

				return reply.status(201).send(result);
			} catch (error) {
				if (error instanceof TemplateError) {
					return reply.status(error.statusCode).send({
						error: error.code,
						message: error.message
					});
				}
				throw error;
			}
		}
	);

	// ─────────────────────────────────────────────
	// GET /api/records
	// ─────────────────────────────────────────────
	app.get('/records', async (request, reply) => {
		const user = request.user as AuthenticatedUser;
		const query = ListQuerySchema.safeParse(request.query);

		if (!query.success) {
			return reply.status(400).send({
				error: 'ValidationError',
				message: 'پارامترهای نامعتبر'
			});
		}

		return listRecords({
			organizationId: user.orgId,
			userId: user.sub,
			roleId: user.roleId,
			baseRole: user.baseRole,
			limit: query.data.limit,
			status: query.data.status
		});
	});

	// ─────────────────────────────────────────────
	// GET /api/records/:id
	// ─────────────────────────────────────────────
	app.get<{ Params: { id: string } }>('/records/:id', async (request, reply) => {
		const user = request.user as AuthenticatedUser;
		const record = await getRecord(request.params.id, {
			organizationId: user.orgId,
			userId: user.sub,
			roleId: user.roleId,
			baseRole: user.baseRole
		});

		if (!record) {
			return reply.status(404).send({
				error: 'NOT_FOUND',
				message: 'پرونده یافت نشد یا دسترسی ندارید'
			});
		}

		return record;
	});
};

export default recordsRoutes;