import { config } from '$lib/config';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface AuthUser {
	id: string;
	name: string;
	phone: string;
	avatar: string | null;
}

export interface AuthOrganization {
	id: string;
	name: string;
	slug: string;
}

export interface AuthRole {
	id: string;
	name: string;
	slug: string;
	baseRole: string;
	permissions: string[];
}

// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════

interface AuthState {
	user: AuthUser | null;
	organization: AuthOrganization | null;
	role: AuthRole | null;
	accessToken: string | null;
	isLoading: boolean;
	isInitialized: boolean;
}

const state = $state<AuthState>({
	user: null,
	organization: null,
	role: null,
	accessToken: null,
	isLoading: false,
	isInitialized: false
});

// ═══════════════════════════════════════════════
// Getters
// ═══════════════════════════════════════════════

export const auth = {
	// State
	get user() { return state.user; },
	get organization() { return state.organization; },
	get role() { return state.role; },
	get accessToken() { return state.accessToken; },
	get isLoading() { return state.isLoading; },
	get isInitialized() { return state.isInitialized; },
	
	// Computed
	get isAuthenticated() {
		return !!state.user && !!state.accessToken;
	},
	
	get isManager() {
		return state.role?.baseRole === 'manager';
	},
	
	// Methods
	hasPermission(permission: string): boolean {
		if (!state.role) return false;
		if (state.role.baseRole === 'manager') return true; // Manager همه چیز دارد
		return state.role.permissions.includes(permission);
	},
	
	// Actions
	async login(phone: string, password: string): Promise<void> {
		state.isLoading = true;
		try {
			const response = await fetch(`${config.apiUrl}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include', // برای Cookie
				body: JSON.stringify({ phone, password })
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'ورود ناموفق');
			}
			
			const data = await response.json();
			
			state.accessToken = data.accessToken;
			state.user = data.user;
			state.organization = data.organization;
			state.role = data.role;
			state.isInitialized = true;
		} finally {
			state.isLoading = false;
		}
	},
	
	async refresh(): Promise<boolean> {
		try {
			const response = await fetch(`${config.apiUrl}/auth/refresh`, {
				method: 'POST',
				credentials: 'include'
			});
			
			if (!response.ok) {
				return false;
			}
			
			const data = await response.json();
			state.accessToken = data.accessToken;
			
			// Get user info
			await this.fetchMe();
			
			return true;
		} catch {
			return false;
		}
	},
	
	async fetchMe(): Promise<void> {
		if (!state.accessToken) return;
		
		const response = await fetch(`${config.apiUrl}/auth/me`, {
			headers: {
				Authorization: `Bearer ${state.accessToken}`
			},
			credentials: 'include'
		});
		
		if (response.ok) {
			const data = await response.json();
			// Update user info if needed
		}
	},
	
	async logout(): Promise<void> {
		try {
			await fetch(`${config.apiUrl}/auth/logout`, {
				method: 'POST',
				credentials: 'include'
			});
		} finally {
			state.user = null;
			state.organization = null;
			state.role = null;
			state.accessToken = null;
		}
	},
	
	async initialize(): Promise<void> {
		if (state.isInitialized) return;
		
		state.isLoading = true;
		try {
			// Try to refresh
			await this.refresh();
		} finally {
			state.isLoading = false;
			state.isInitialized = true;
		}
	},
	
	// Internal — برای API Client
	setAccessToken(token: string) {
		state.accessToken = token;
	},
	
	clear() {
		state.user = null;
		state.organization = null;
		state.role = null;
		state.accessToken = null;
	}
};