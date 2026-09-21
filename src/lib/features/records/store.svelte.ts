import { api } from '$lib/api/client';
import type { RecordListItem, RecordDetail } from './types';
import type { Template } from '$lib/features/templates/types';

interface RecordsState {
	items: RecordListItem[];
	isLoading: boolean;
	currentRecord: RecordDetail | null;
	availableTemplates: Template[];
	isLoadingTemplates: boolean;
}

const state = $state<RecordsState>({
	items: [],
	isLoading: false,
	currentRecord: null,
	availableTemplates: [],
	isLoadingTemplates: false
});

export const records = {
	get items() { return state.items; },
	get isLoading() { return state.isLoading; },
	get currentRecord() { return state.currentRecord; },
	get availableTemplates() { return state.availableTemplates; },
	get isLoadingTemplates() { return state.isLoadingTemplates; },

	async list(): Promise<void> {
		state.isLoading = true;
		try {
			state.items = await api.get<RecordListItem[]>('/records');
		} finally {
			state.isLoading = false;
		}
	},

	async load(recordId: string): Promise<void> {
		state.currentRecord = await api.get<RecordDetail>(`/records/${recordId}`);
	},

	async loadAvailableTemplates(recordId: string): Promise<void> {
		state.isLoadingTemplates = true;
		try {
			const result = await api.get<{ templates: Template[] }>(
				`/templates/for-record/${recordId}`
			);
			state.availableTemplates = result.templates;
		} finally {
			state.isLoadingTemplates = false;
		}
	},

	async continueRecord(recordId: string, templateId: string, data: Record<string, unknown>) {
		const clientOperationId = crypto.randomUUID();
		const result = await api.post(`/records/${recordId}/continue`, {
			templateId,
			data,
			clientOperationId
		});
		return result;
	},

	clear() {
		state.items = [];
		state.currentRecord = null;
		state.availableTemplates = [];
	}
};