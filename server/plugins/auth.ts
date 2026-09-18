import fp from 'fastify-plugin';
import { verifyAccessToken, type AccessTokenPayload } from '../services/jwt.js';

export default fp(async (app) => {
	app.decorate('authenticate', async function (request, reply) {
		try {
			const authHeader = request.headers.authorization;
			
			if (!authHeader || !authHeader.startsWith('Bearer ')) {
				return reply.status(401).send({
					error: 'Unauthorized',
					message: 'توکن احراز هویت یافت نشد'
				});
			}
			
			const token = authHeader.slice(7);
			const payload = await verifyAccessToken(token);
			
			if (!payload.isMember) {
				return reply.status(403).send({
					error: 'NotMember',
					message: 'شما عضو این سازمان نیستید'
				});
			}
			
			request.user = payload;
		} catch {
			return reply.status(401).send({
				error: 'Unauthorized',
				message: 'توکن نامعتبر یا منقضی شده است'
			});
		}
	});
	
	app.decorate('requirePermission', function (permission: string) {
		return async function (request: any, reply: any) {
			if (!request.user) {
				return reply.status(401).send({
					error: 'Unauthorized',
					message: 'احراز هویت نشده'
				});
			}
			
			if (!request.user.permissions.includes(permission)) {
				return reply.status(403).send({
					error: 'Forbidden',
					message: `دسترسی لازم: ${permission}`
				});
			}
		};
	});
}, {
	name: 'auth-plugin'
});

// Type Declaration
declare module 'fastify' {
	export interface FastifyInstance {
		authenticate: (request: any, reply: any) => Promise<void>;
		requirePermission: (permission: string) => (request: any, reply: any) => Promise<void>;
	}
	
	export interface FastifyRequest {
		user?: AccessTokenPayload;
	}
}