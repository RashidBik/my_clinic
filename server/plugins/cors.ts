import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { env } from '../config/env.js';

export default fp(async (app) => {
	await app.register(cors, {
		origin: env.NODE_ENV === 'development'
			? true // Allow all in dev
			: [
				/^https?:\/\/localhost(:\d+)?$/,
				/^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
				/^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/
			],
		credentials: true
	});
}, {
	name: 'cors-plugin'
});