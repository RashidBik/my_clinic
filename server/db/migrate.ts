import 'dotenv/config';   // ← اضافه کن

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './client.js';

console.log('🚀 Running migrations...');

try {
	migrate(db, { migrationsFolder: './server/db/migrations' });
	console.log('✅ Migrations completed');
} catch (error) {
	console.error('❌ Migration failed:', error);
	process.exit(1);
} finally {
	sqlite.close();
}