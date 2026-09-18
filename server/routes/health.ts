import type { FastifyPluginAsync } from 'fastify';

const healthRoutes: FastifyPluginAsync = async (app) => {
	app.get('/health', async () => {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			uptime: process.uptime()
		};
	});
};

export default healthRoutes;