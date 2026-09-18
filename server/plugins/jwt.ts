import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { env } from '../config/env.js';

export default fp(async (app) => {
	await app.register(jwt, {
		secret: env.JWT_SECRET,
		sign: {
			expiresIn: env.JWT_ACCESS_EXPIRES
		}
	});
	
	app.decorate('authenticate', async function (request, reply) {
		try {
			await request.jwtVerify();
		} catch (err) {
			reply.status(401).send({
				error: 'Unauthorized',
				message: 'توکن نامعتبر است'
			});
		}
	});
}, {
	name: 'jwt-plugin'
});

// Type Declaration
declare module 'fastify' {
	export interface FastifyInstance {
		authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
	}
}