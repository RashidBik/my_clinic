import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
	getProfile,
	updateProfile,
	changePassword,
	ProfileError
} from '../services/profile.js';

// ═══════════════════════════════════════════════
// Schemas
// ═══════════════════════════════════════════════

const UpdateProfileSchema = z.object({
	name: z.string().min(2).max(100).optional(),
	avatar: z.string().url().nullable().optional()
});

const ChangePasswordSchema = z.object({
	currentPassword: z.string().min(6).max(100),
	newPassword: z.string().min(6).max(100)
});

// ═══════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════

const profileRoutes: FastifyPluginAsync = async (app) => {
	app.addHook('preHandler', app.authenticate);

	// GET /api/profile
	app.get('/profile', async (request) => {
		return getProfile(request.user!.sub, request.user!.orgId);
	});

	// PATCH /api/profile
	app.patch('/profile', async (request, reply) => {
		const body = UpdateProfileSchema.safeParse(request.body);

		if (!body.success) {
			return reply.status(400).send({
				error: 'ValidationError',
				message: 'اطلاعات نامعتبر',
				details: body.error.flatten().fieldErrors
			});
		}

		try {
			await updateProfile(request.user!.sub, body.data);
			return { success: true };
		} catch (error) {
			if (error instanceof ProfileError) {
				return reply.status(error.statusCode).send({
					error: error.code,
					message: error.message
				});
			}
			throw error;
		}
	});

	// POST /api/profile/change-password
	app.post('/profile/change-password', async (request, reply) => {
		const body = ChangePasswordSchema.safeParse(request.body);

		if (!body.success) {
			return reply.status(400).send({
				error: 'ValidationError',
				message: 'اطلاعات نامعتبر',
				details: body.error.flatten().fieldErrors
			});
		}

		try {
			await changePassword(request.user!.sub, body.data);
			return { success: true };
		} catch (error) {
			if (error instanceof ProfileError) {
				return reply.status(error.statusCode).send({
					error: error.code,
					message: error.message
				});
			}
			throw error;
		}
	});
};

export default profileRoutes;