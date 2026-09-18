import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { env } from '../config/env.js';
import * as schema from './schema/index.js';

// اطمینان از وجود پوشه
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const dbPath = env.DATABASE_URL;
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);

// WAL Mode برای Concurrency بهتر
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = NORMAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('busy_timeout = 5000');

export const db = drizzle(sqlite, { schema });

export type Database = typeof db;
export { sqlite };