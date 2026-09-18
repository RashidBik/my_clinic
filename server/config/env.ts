import 'dotenv/config';  
import { z } from 'zod';

const EnvSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().default(3001),
	HOST: z.string().default('0.0.0.0'),
	
	JWT_SECRET: z.string().min(32),
	JWT_ACCESS_EXPIRES: z.string().default('15m'),
	JWT_REFRESH_EXPIRES: z.string().default('30d'),
	
	DATABASE_URL: z.string().default('./data/clinic.db'),
	
	VAPID_PUBLIC_KEY: z.string().optional(),
	VAPID_PRIVATE_KEY: z.string().optional(),
	VAPID_SUBJECT: z.string().optional(),
	
	FIREBASE_PROJECT_ID: z.string().optional(),
	FIREBASE_CLIENT_EMAIL: z.string().optional(),
	FIREBASE_PRIVATE_KEY: z.string().optional()
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
	console.error('❌ Invalid environment variables:');
	console.error(parsed.error.flatten().fieldErrors);
	process.exit(1);
}

export const env = parsed.data;