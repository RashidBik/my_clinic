import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			out: 'build',
			precompress: false,
			envPrefix: ''
		}),
		alias: {
			$components: 'src/lib/components',
			$features: 'src/lib/features',
			$server: 'src/lib/server',
			$shared: 'src/lib/shared',
			$utils: 'src/lib/utils',
			$stores: 'src/lib/stores',
			$api: 'src/lib/api'
		}
	}
};

export default config;
