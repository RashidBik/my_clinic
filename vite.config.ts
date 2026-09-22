import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'fs';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit()
	],
	
	server: {
		host: '0.0.0.0',
		port: 5173,
		https: {
			key: readFileSync('./certs/key.pem'),
			cert: readFileSync('./certs/cert.pem')
		},
	},
	
	optimizeDeps: {
		include: [
			'date-fns-jalali',
			'zod',
			'dexie',
			'socket.io-client'
		]
	}
});