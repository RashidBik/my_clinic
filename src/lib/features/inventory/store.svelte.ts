import { api } from '$lib/api/client';
import type { InventoryItem, InventoryTransaction, InventoryStats } from './types';

interface InventoryState {
	items: InventoryItem[];
	lowStockItems: InventoryItem[];
	expiringItems: InventoryItem[];
	transactions: InventoryTransaction[];
	stats: InventoryStats | null;
	isLoading: boolean;
	isSaving: boolean;
}

const state = $state<InventoryState>({
	items: [],
	lowStockItems: [],
	expiringItems: [],
	transactions: [],
	stats: null,
	isLoading: false,
	isSaving: false
});

export const inventory = {
	get items() { return state.items; },
	get lowStockItems() { return state.lowStockItems; },
	get expiringItems() { return state.expiringItems; },
	get transactions() { return state.transactions; },
	get stats() { return state.stats; },
	get isLoading() { return state.isLoading; },
	get isSaving() { return state.isSaving; },

	async load(options: { search?: string; categoryId?: string; lowStockOnly?: boolean } = {}) {
		state.isLoading = true;
		try {
			const params = new URLSearchParams();
			if (options.search) params.set('search', options.search);
			if (options.categoryId) params.set('categoryId', options.categoryId);
			if (options.lowStockOnly) params.set('lowStockOnly', 'true');

			const result = await api.get<{ items: InventoryItem[] }>(
				`/inventory/items?${params}`
			);
			state.items = result.items;
		} finally {
			state.isLoading = false;
		}
	},

	async loadStats() {
		state.stats = await api.get<InventoryStats>('/inventory/stats');
	},

	async loadLowStock() {
		const result = await api.get<{ items: InventoryItem[] }>(
			'/inventory/alerts/low-stock'
		);
		state.lowStockItems = result.items;
	},

	async loadExpiring() {
		const result = await api.get<{ items: InventoryItem[] }>(
			'/inventory/alerts/expiring'
		);
		state.expiringItems = result.items;
	},

	async loadTransactions(itemId?: string) {
		const params = itemId ? `?itemId=${itemId}` : '';
		const result = await api.get<{ transactions: InventoryTransaction[] }>(
			`/inventory/transactions${params}`
		);
		state.transactions = result.transactions;
	},

	async createItem(input: Record<string, unknown>): Promise<string> {
		state.isSaving = true;
		try {
			const result = await api.post<{ id: string }>('/inventory/items', input);
			await this.load();
			return result.id;
		} finally {
			state.isSaving = false;
		}
	},

	async updateItem(id: string, input: Record<string, unknown>) {
		state.isSaving = true;
		try {
			await api.patch(`/inventory/items/${id}`, input);
			await this.load();
		} finally {
			state.isSaving = false;
		}
	},

	async adjustStock(input: {
		itemId: string;
		type: string;
		quantity: number;
		unitPrice?: number;
		notes?: string;
	}) {
		state.isSaving = true;
		try {
			await api.post('/inventory/adjust', input);
			await this.load();
			await this.loadStats();
		} finally {
			state.isSaving = false;
		}
	},

	clear() {
		state.items = [];
		state.transactions = [];
		state.stats = null;
	}
};