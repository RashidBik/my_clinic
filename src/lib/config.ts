import { env } from '$env/dynamic/public';

export const config = {
	apiUrl: env.PUBLIC_API_URL || 'http://localhost:3001/api'
} as const;