import Fastify, { type FastifyInstance, type FastifyError } from 'fastify';
import { env } from './config/env.js';
import dbPlugin from './plugins/db.js';

import corsPlugin from './plugins/cors.js';
import loggerPlugin from './plugins/logger.js';
import jwtPlugin from './plugins/jwt.js';
import cookiePlugin from './plugins/cookie.js';

import healthRoutes from './routes/health.js';
import authPlugin from './plugins/auth.js';
import authRoutes from './routes/auth.js';

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
	
	// Plugins
	await app.register(loggerPlugin);
	await app.register(corsPlugin);
	await app.register(cookiePlugin);
	await app.register(jwtPlugin);
	await app.register(dbPlugin);
	await app.register(authPlugin); 

	
	// Routes
	await app.register(healthRoutes, { prefix: '/api' });
	await app.register(authRoutes, { prefix: '/api' });  
	
	// Error Handler
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
	
	return app;
}