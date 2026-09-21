import { api } from '$lib/api/client';
import { auth } from '$lib/stores/auth.svelte';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface ProfileData {
	user: {
		id: string;
		name: string;
		phone: string;
		avatar: string | null;
		lastLoginAt: string | null;
		createdAt: string;
	};
	organization: {
		id: string;
		name: string;
		slug: string;
		type: string;
	};
	role: {
		id: string;
		name: string;
		slug: string;
		baseRole: string;
		permissions: string[];
	};
	membership: {
		joinedAt: string;
		status: string;
	};
}

// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════

interface ProfileState {
	data: ProfileData | null;
	isLoading: boolean;
	isSaving: boolean;
	error: string | null;
}

const state = $state<ProfileState>({
	data: null,
	isLoading: false,
	isSaving: false,
	error: null
});

// ═══════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════

export const profile = {
	get data() { return state.data; },
	get isLoading() { return state.isLoading; },
	get isSaving() { return state.isSaving; },
	get error() { return state.error; },

	async load(): Promise<void> {
		state.isLoading = true;
		state.error = null;
		try {
			state.data = await api.get<ProfileData>('/profile');
		} catch (err) {
			state.error = err instanceof Error ? err.message : 'خطا در بارگذاری';
			throw err;
		} finally {
			state.isLoading = false;
		}
	},

	async update(input: { name?: string; avatar?: string | null }): Promise<void> {
		state.isSaving = true;
		try {
			await api.patch('/profile', input);

			// بروزرسانی Local
			if (state.data) {
				if (input.name !== undefined) state.data.user.name = input.name;
				if (input.avatar !== undefined) state.data.user.avatar = input.avatar;
			}

			// بروزرسانی Auth Store (تا نام در Chat Header عوض شود)
			if (auth.user && input.name !== undefined) {
				// چون auth.user از $state است، مستقیم تغییر نمی‌دهیم
				// اما در auth store می‌توانیم متد setUser داشته باشیم
			}
		} finally {
			state.isSaving = false;
		}
	},

	async changePassword(currentPassword: string, newPassword: string): Promise<void> {
		state.isSaving = true;
		try {
			await api.post('/profile/change-password', {
				currentPassword,
				newPassword
			});
		} finally {
			state.isSaving = false;
		}
	},

	clear() {
		state.data = null;
		state.error = null;
	}
};