import { api } from '$lib/api/client';
import type { Member, Role } from './types';

interface ManagementState {
	members: Member[];
	roles: Role[];
	isLoading: boolean;
	isSaving: boolean;
	error: string | null;
}

const state = $state<ManagementState>({
	members: [],
	roles: [],
	isLoading: false,
	isSaving: false,
	error: null
});

export const management = {
	get members() { return state.members; },
	get roles() { return state.roles; },
	get isLoading() { return state.isLoading; },
	get isSaving() { return state.isSaving; },
	get error() { return state.error; },

	async loadMembers(search?: string) {
		state.isLoading = true;
		try {
			const params = search ? `?search=${encodeURIComponent(search)}` : '';
			const result = await api.get<{ members: Member[] }>(`/members${params}`);
			state.members = result.members;
		} catch (err) {
			state.error = err instanceof Error ? err.message : 'خطا';
		} finally {
			state.isLoading = false;
		}
	},

	async loadRoles() {
		const result = await api.get<{ roles: Role[] }>('/members/roles');
		state.roles = result.roles;
	},

	async createMember(input: {
		name: string;
		phone: string;
		password: string;
		roleId: string;
	}) {
		state.isSaving = true;
		try {
			await api.post('/members', input);
			await this.loadMembers();
		} finally {
			state.isSaving = false;
		}
	},

	async updateMember(id: string, input: { roleId?: string; status?: string }) {
		state.isSaving = true;
		try {
			await api.patch(`/members/${id}`, input);
			await this.loadMembers();
		} finally {
			state.isSaving = false;
		}
	},

	async deleteMember(id: string) {
		state.isSaving = true;
		try {
			await api.delete(`/members/${id}`);
			await this.loadMembers();
		} finally {
			state.isSaving = false;
		}
	}
};