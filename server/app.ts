import Fastify, { type FastifyInstance, type FastifyError } from 'fastify';
import { env } from './config/env.js';
import { setupSocketIO } from './realtime/socket.js';

import corsPlugin from './plugins/cors.js';
import loggerPlugin from './plugins/logger.js';
import jwtPlugin from './plugins/jwt.js';
import cookiePlugin from './plugins/cookie.js';
import authPlugin from './plugins/auth.js';
import dbPlugin from './plugins/db.js';

import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import profileRoutes from './routes/profile.js';
import recordsRoutes from './routes/records.js';
import templatesRoutes from './routes/templates.js';
import inventoryRoutes from './routes/inventory.js';



// ═══════════════════════════════════════════════
// Type Declaration
// ═══════════════════════════════════════════════

declare module 'fastify' {
	interface FastifyInstance {
		io?: import('socket.io').Server;
	}
}

// ═══════════════════════════════════════════════
// Build
// ═══════════════════════════════════════════════

export async function buildApp(): Promise<FastifyInstance> {
	const app = Fastify({
		logger: env.NODE_ENV === 'development'
			? {
				transport: {
					target: 'pino-pretty',
					options: {
						colorize: true,
						translateTime: 'SYS:standard',
						ignore: 'pid,hostname'
					}
				}
			}
			: true,
		trustProxy: true
	});
	
	// ─────────────────────────────────────────────
	// Plugins
	// ─────────────────────────────────────────────
	await app.register(loggerPlugin);
	await app.register(corsPlugin);
	await app.register(cookiePlugin);
	await app.register(jwtPlugin);
	await app.register(authPlugin);
	await app.register(dbPlugin);
	
	// ─────────────────────────────────────────────
	// Socket.io
	// ─────────────────────────────────────────────
	const io = setupSocketIO(app.server);
	app.decorate('io', io);
	
	// ─────────────────────────────────────────────
	// Routes
	// ─────────────────────────────────────────────
	await app.register(healthRoutes, { prefix: '/api' });
	await app.register(authRoutes, { prefix: '/api' });
	await app.register(chatRoutes, { prefix: '/api' });
	await app.register(profileRoutes, { prefix: '/api' });
	await app.register(recordsRoutes, { prefix: '/api' });
	await app.register(templatesRoutes, { prefix: '/api' });
	await app.register(inventoryRoutes, { prefix: '/api' });


	
	// ─────────────────────────────────────────────
	// Error Handler
	// ─────────────────────────────────────────────
	app.setErrorHandler((error: FastifyError, request, reply) => {
		app.log.error(error);
		
		if (error.validation) {
			return reply.status(400).send({
				error: 'ValidationError',
				message: error.message,
				details: error.validation
			});
		}
		
		return reply.status(error.statusCode ?? 500).send({
			error: error.name ?? 'InternalServerError',
			message: env.NODE_ENV === 'production'
				? 'خطای سرور'
				: error.message
		});
	});
	
	// ─────────────────────────────────────────────
	// Cleanup
	// ─────────────────────────────────────────────
	app.addHook('onClose', async () => {
		io.close();
	});
	
	return app;
}