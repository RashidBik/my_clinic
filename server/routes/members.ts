import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
	listMembers,
	createMember,
	updateMember,
	deleteMember,
	listRoles,
	MemberError
} from '../services/members.js';

// ═══════════════════════════════════════════════
// Schemas
// ═══════════════════════════════════════════════

const ListQuerySchema = z.object({
	search: z.string().optional(),
	roleId: z.string().optional()
});

const CreateMemberSchema = z.object({
	name: z.string().min(2).max(100),
	phone: z.string().min(10).max(20),
	password: z.string().min(6).max(100),
	roleId: z.string()
});

const UpdateMemberSchema = z.object({
	roleId: z.string().optional(),
	status: z.enum(['active', 'inactive', 'suspended']).optional(),
	isMember: z.boolean().optional()
});

// ═══════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════

const membersRoutes: FastifyPluginAsync = async (app) => {
	// همه نیاز به Auth + Manager دارند
	app.addHook('preHandler', app.authenticate);

	// فقط Manager
	app.addHook('preHandler', async (request, reply) => {
		if ((request.user as { baseRole: string }).baseRole !== 'manager') {
			return reply.status(403).send({
				error: 'FORBIDDEN',
				message: 'فقط مدیر می‌تواند کارمندان را مدیریت کند'
			});
		}
	});

	// GET /api/members
	app.get('/members', async (request, reply) => {
		const query = ListQuerySchema.safeParse(request.query);
		if (!query.success) {
			return reply.status(400).send({ error: 'ValidationError' });
		}

		const members = await listMembers({
			organizationId: (request.user as { orgId: string }).orgId,
			...query.data
		});

		return { members };
	});

	// POST /api/members
	app.post('/members', async (request, reply) => {
		const body = CreateMemberSchema.safeParse(request.body);
		if (!body.success) {
			return reply.status(400).send({
				error: 'ValidationError',
				details: body.error.flatten().fieldErrors
			});
		}

		try {
			const id = await createMember({
				organizationId: (request.user as { orgId: string }).orgId,
				...body.data
			});
			return reply.status(201).send({ id });
		} catch (error) {
			if (error instanceof MemberError) {
				return reply.status(error.statusCode).send({
					error: error.code,
					message: error.message
				});
			}
			throw error;
		}
	});

	// PATCH /api/members/:id
	app.patch<{ Params: { id: string } }>('/members/:id', async (request, reply) => {
		const body = UpdateMemberSchema.safeParse(request.body);
		if (!body.success) {
			return reply.status(400).send({ error: 'ValidationError' });
		}

		try {
			await updateMember(
				request.params.id,
				(request.user as { orgId: string }).orgId,
				body.data
			);
			return { success: true };
		} catch (error) {
			if (error instanceof MemberError) {
				return reply.status(error.statusCode).send({
					error: error.code,
					message: error.message
				});
			}
			throw error;
		}
	});

	// DELETE /api/members/:id
	app.delete<{ Params: { id: string } }>('/members/:id', async (request, reply) => {
		try {
			await deleteMember(
				request.params.id,
				(request.user as { orgId: string }).orgId,
				(request.user as { sub: string }).sub
			);
			return { success: true };
		} catch (error) {
			if (error instanceof MemberError) {
				return reply.status(error.statusCode).send({
					error: error.code,
					message: error.message
				});
			}
			throw error;
		}
	});

	// GET /api/members/roles
	app.get('/members/roles', async (request) => {
		const user = request.user as { orgId: string };
		const roles = await listRoles(user.orgId);
		return { roles };
	});
};

export default membersRoutes;