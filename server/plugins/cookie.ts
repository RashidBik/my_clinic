import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';

export default fp(async (app) => {
	await app.register(cookie, {
		secret: process.env.COOKIE_SECRET || 'cookie-secret-min-32-chars-long',
		parseOptions: {}
	});
}, {
	name: 'cookie-plugin'
});