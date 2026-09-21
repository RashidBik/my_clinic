import { api } from '$lib/api/client';
import type { Template } from './types';

interface TemplatesState {
	items: Template[];
	isLoading: boolean;
	error: string | null;
}

const state = $state<TemplatesState>({
	items: [],
	isLoading: false,
	error: null
});

export const templates = {
	get items() { return state.items; },
	get isLoading() { return state.isLoading; },
	get error() { return state.error; },

	async load(): Promise<void> {
		state.isLoading = true;
		state.error = null;
		try {
			const result = await api.get<{ templates: Template[] }>('/templates');
			state.items = result.templates;
		} catch (err) {
			state.error = err instanceof Error ? err.message : 'خطا در بارگذاری';
		} finally {
			state.isLoading = false;
		}
	},

	clear() {
		state.items = [];
	}
};