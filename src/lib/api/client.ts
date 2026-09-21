import { auth } from '$lib/stores/auth.svelte';
import { config } from '$lib/config';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface ApiError {
	error: string;
	message: string;
	details?: unknown;
}

export class ApiRequestError extends Error {
	constructor(
		public status: number,
		public code: string,
		message: string,
		public details?: unknown
	) {
		super(message);
		this.name = 'ApiRequestError';
	}
}

// ═══════════════════════════════════════════════
// Request Options
// ═══════════════════════════════════════════════

interface RequestOptions extends Omit<RequestInit, 'body'> {
	body?: unknown;
	skipAuth?: boolean;
	skipRefresh?: boolean;
}

// ═══════════════════════════════════════════════
// Core Request
// ═══════════════════════════════════════════════

let refreshPromise: Promise<boolean> | null = null;

async function ensureFreshToken(): Promise<boolean> {
	if (refreshPromise) {
		return refreshPromise;
	}
	
	refreshPromise = auth.refresh();
	
	try {
		return await refreshPromise;
	} finally {
		refreshPromise = null;
	}
}

async function request<T>(
	endpoint: string,
	options: RequestOptions = {},
	retry = true
): Promise<T> {
	const { body, skipAuth, skipRefresh, ...fetchOptions } = options;
	
	// Headers
	const headers = new Headers(fetchOptions.headers);
	if (body && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}
	
	// Auth
	if (!skipAuth && auth.accessToken) {
		headers.set('Authorization', `Bearer ${auth.accessToken}`);
	}
	
	// Fetch
	const response = await fetch(`${config.apiUrl}${endpoint}`, {
		...fetchOptions,
		headers,
		body: body ? JSON.stringify(body) : undefined,
		credentials: 'include'
	});
	
	// 401 — Token Expired → Refresh
	if (response.status === 401 && retry && !skipAuth && !skipRefresh) {
		const refreshed = await ensureFreshToken();
		
		if (refreshed) {
			return request<T>(endpoint, options, false);
		} else {
			auth.clear();
			throw new ApiRequestError(
				401,
				'Unauthorized',
				'نشست شما منقضی شده است. لطفاً دوباره وارد شوید.'
			);
		}
	}
	
	// Parse Response
	let data: unknown;
	const contentType = response.headers.get('content-type');
	
	if (contentType?.includes('application/json')) {
		data = await response.json();
	} else {
		data = await response.text();
	}
	
	// Error
	if (!response.ok) {
	const errorData = data as ApiError;
	console.error('API Error:', {
		status: response.status,
		endpoint,
		errorData
	});
	throw new ApiRequestError(
		response.status,
		errorData.error || 'UnknownError',
		errorData.message || 'خطای ناشناخته',
		errorData.details
	);
}
	
	return data as T;
}

// ═══════════════════════════════════════════════
// HTTP Methods
// ═══════════════════════════════════════════════

export const api = {
	get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
		return request<T>(endpoint, { ...options, method: 'GET' });
	},
	
	post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
		return request<T>(endpoint, { ...options, method: 'POST', body });
	},
	
	put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
		return request<T>(endpoint, { ...options, method: 'PUT', body });
	},
	
	patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
		return request<T>(endpoint, { ...options, method: 'PATCH', body });
	},
	
	delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
		return request<T>(endpoint, { ...options, method: 'DELETE' });
	}
};