import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { login, refresh, logout, AuthError } from '../services/auth.js';
import { env } from '../config/env.js';

// ═══════════════════════════════════════════════
// Schemas
// ═══════════════════════════════════════════════

const LoginSchema = z.object({
	phone: z.string().min(10).max(20),
	password: z.string().min(6).max(100)
});

// ═══════════════════════════════════════════════
// Cookie Config
// ═══════════════════════════════════════════════

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_OPTIONS = {
	httpOnly: true,
	secure: env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	path: '/',
	maxAge: 30 * 24 * 60 * 60 // 30 روز
};

// ═══════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════

const authRoutes: FastifyPluginAsync = async (app) => {
	// ─────────────────────────────────────────────
	// POST /api/auth/login
	// ─────────────────────────────────────────────
	app.post('/auth/login', async (request, reply) => {
		const body = LoginSchema.safeParse(request.body);
		
		if (!body.success) {
			return reply.status(400).send({
				error: 'ValidationError',
				message: 'اطلاعات ورودی نامعتبر',
				details: body.error.flatten().fieldErrors
			});
		}
		
		try {
			const result = await login({
				phone: body.data.phone,
				password: body.data.password,
				userAgent: request.headers['user-agent'],
				ipAddress: request.ip
			});
			
			// Set Refresh Token در Cookie
			reply.setCookie(
				REFRESH_COOKIE_NAME,
				result.refreshToken,
				REFRESH_COOKIE_OPTIONS
			);
			
			// Access Token و User Info در Body
			return {
				accessToken: result.accessToken,
				user: result.user,
				organization: result.organization,
				role: result.role
			};
		} catch (error) {
			if (error instanceof AuthError) {
				return reply.status(error.statusCode).send({
					error: error.code,
					message: error.message
				});
			}
			throw error;
		}
	});
	
	// ─────────────────────────────────────────────
	// POST /api/auth/refresh
	// ─────────────────────────────────────────────
	app.post('/auth/refresh', async (request, reply) => {
		const refreshToken = request.cookies[REFRESH_COOKIE_NAME];
		
		if (!refreshToken) {
			return reply.status(401).send({
				error: 'NoToken',
				message: 'توکن تازه‌سازی یافت نشد'
			});
		}
		
		try {
			const result = await refresh(refreshToken);
			return { accessToken: result.accessToken };
		} catch (error) {
			if (error instanceof AuthError) {
				reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
				return reply.status(error.statusCode).send({
					error: error.code,
					message: error.message
				});
			}
			throw error;
		}
	});
	
	// ─────────────────────────────────────────────
	// POST /api/auth/logout
	// ─────────────────────────────────────────────
	app.post('/auth/logout', async (request, reply) => {
		const refreshToken = request.cookies[REFRESH_COOKIE_NAME];
		
		if (refreshToken) {
			await logout(refreshToken);
		}
		
		reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
		return { success: true };
	});
	
	// ─────────────────────────────────────────────
	// GET /api/auth/me
	// ─────────────────────────────────────────────
	app.get('/auth/me', {
		preHandler: [app.authenticate]
	}, async (request) => {
		return {
			user: {
				id: request.user!.sub,
				orgId: request.user!.orgId,
				roleId: request.user!.roleId,
				roleSlug: request.user!.roleSlug,
				baseRole: request.user!.baseRole,
				permissions: request.user!.permissions
			}
		};
	});
};

export default authRoutes;