import fp from 'fastify-plugin';
import { db } from '../db/client.js';

export default fp(async (app) => {
	app.decorate('db', db);
	
	app.addHook('onClose', async () => {
		app.log.info('Closing database...');
		// better-sqlite3 خودکار می‌بندد
	});
}, {
	name: 'db-plugin'
});

// Type Declaration
declare module 'fastify' {
	export interface FastifyInstance {
		db: typeof db;
	}
}