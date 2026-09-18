import { createHash, randomBytes } from 'node:crypto';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users, members, roles, organizations } from '../db/schema/core.js';
import { refreshTokens } from '../db/schema/audit.js';
import { verifyPassword } from './password.js';
import {
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
	type AccessTokenPayload
} from './jwt.js';
import { env } from '../config/env.js';
import { createId } from '@paralleldrive/cuid2';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface LoginInput {
	phone: string;
	password: string;
	organizationSlug?: string;
	userAgent?: string;
	ipAddress?: string;
}

export interface LoginResult {
	accessToken: string;
	refreshToken: string;
	user: {
		id: string;
		name: string;
		phone: string;
		avatar: string | null;
	};
	organization: {
		id: string;
		name: string;
		slug: string;
	};
	role: {
		id: string;
		name: string;
		slug: string;
		baseRole: string;
		permissions: string[];
	};
}

// ═══════════════════════════════════════════════
// Login
// ═══════════════════════════════════════════════

export async function login(input: LoginInput): Promise<LoginResult> {
	// 1. Find user
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.phone, input.phone))
		.limit(1);
	
	if (!user || !user.passwordHash) {
		throw new AuthError('INVALID_CREDENTIALS', 'شماره تلفن یا رمز عبور اشتباه است');
	}
	
	// 2. Verify password
	const valid = await verifyPassword(input.password, user.passwordHash);
	if (!valid) {
		throw new AuthError('INVALID_CREDENTIALS', 'شماره تلفن یا رمز عبور اشتباه است');
	}
	
	// 3. Find membership
	const memberships = await db
		.select({
			member: members,
			role: roles,
            organization: organizations 
		})
		.from(members)
		.innerJoin(roles, eq(members.roleId, roles.id))
        .innerJoin(organizations, eq(members.organizationId, organizations.id))
		.where(
			and(
				eq(members.userId, user.id),
				eq(members.isMember, true),
				eq(members.status, 'active')
			)
		);
	
	if (memberships.length === 0) {
		throw new AuthError('NOT_A_MEMBER', 'شما عضو هیچ سازمانی نیستید');
	}
	
	// 4. Pick organization (اگر چند تا دارد، اولی)
	// TODO: اگر چند Org دارد، باید انتخاب شود
	const membership = memberships[0]!;
	const role = membership.role;
    const organization = membership.organization;
	
	// 5. Generate tokens
	const tokenId = createId();
	
	const accessToken = await signAccessToken({
		sub: user.id,
		orgId: role.organizationId,
		roleId: role.id,
		roleSlug: role.slug,
		baseRole: role.baseRole,
		permissions: role.permissions || [],
		isMember: true
	});
	
	const refreshToken = await signRefreshToken(user.id, tokenId);
	
	// 6. Save refresh token hash
	const tokenHash = hashToken(refreshToken);
	const expiresAt = new Date(Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRES));
	
	await db.insert(refreshTokens).values({
		id: tokenId,
		userId: user.id,
		tokenHash,
		userAgent: input.userAgent,
		ipAddress: input.ipAddress,
		expiresAt
	});
	
	// 7. Update last login
	await db
		.update(users)
		.set({ lastLoginAt: new Date() })
		.where(eq(users.id, user.id));
	
	return {
		accessToken,
		refreshToken,
		user: {
			id: user.id,
			name: user.name,
			phone: user.phone,
			avatar: user.avatar
		},
		organization: {
		id: organization.id,       
		name: organization.name,   
		slug: organization.slug 
		},
		role: {
			id: role.id,
			name: role.name,
			slug: role.slug,
			baseRole: role.baseRole,
			permissions: role.permissions || []
		}
	};
}

// ═══════════════════════════════════════════════
// Refresh
// ═══════════════════════════════════════════════

export interface RefreshResult {
	accessToken: string;
}

export async function refresh(refreshToken: string): Promise<RefreshResult> {
	// 1. Verify JWT
	let payload;
	try {
		payload = await verifyRefreshToken(refreshToken);
	} catch {
		throw new AuthError('INVALID_TOKEN', 'توکن نامعتبر است');
	}
	
	// 2. Find in DB
	const tokenHash = hashToken(refreshToken);
	
	const [tokenRecord] = await db
		.select()
		.from(refreshTokens)
		.where(eq(refreshTokens.tokenHash, tokenHash))
		.limit(1);
	
	if (!tokenRecord) {
		throw new AuthError('INVALID_TOKEN', 'توکن یافت نشد');
	}
	
	if (tokenRecord.revokedAt) {
		throw new AuthError('TOKEN_REVOKED', 'توکن لغو شده است');
	}
	
	if (tokenRecord.expiresAt < new Date()) {
		throw new AuthError('TOKEN_EXPIRED', 'توکن منقضی شده است');
	}
	
	// 3. Get user + membership
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, payload.sub))
		.limit(1);
	
	if (!user || !user.isActive) {
		throw new AuthError('USER_INACTIVE', 'کاربر غیرفعال است');
	}
	
	const memberships = await db
		.select({ member: members, role: roles, organization: organizations })
		.from(members)
		.innerJoin(roles, eq(members.roleId, roles.id))
		.innerJoin(organizations, eq(members.organizationId, organizations.id))
		.where(
			and(
				eq(members.userId, user.id),
				eq(members.isMember, true),
				eq(members.status, 'active')
			)
		);
	
	if (memberships.length === 0) {
		throw new AuthError('NOT_A_MEMBER', 'عضو سازمان نیستید');
	}
	
	const role = memberships[0]!.role;
	
	// 4. Generate new access token
	const accessToken = await signAccessToken({
		sub: user.id,
		orgId: role.organizationId,
		roleId: role.id,
		roleSlug: role.slug,
		baseRole: role.baseRole,
		permissions: role.permissions || [],
		isMember: true
	});
	
	return { accessToken };
}

// ═══════════════════════════════════════════════
// Logout
// ═══════════════════════════════════════════════

export async function logout(refreshToken: string): Promise<void> {
	const tokenHash = hashToken(refreshToken);
	
	await db
		.update(refreshTokens)
		.set({ revokedAt: new Date() })
		.where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function logoutAll(userId: string): Promise<void> {
	await db
		.update(refreshTokens)
		.set({ revokedAt: new Date() })
		.where(
			and(
				eq(refreshTokens.userId, userId),
				isNull(refreshTokens.revokedAt)
			)
		);
}

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

function parseExpiry(expiry: string): number {
	// "15m" → 900000
	const match = expiry.match(/^(\d+)([smhd])$/);
	if (!match) throw new Error(`Invalid expiry: ${expiry}`);
	
	const value = parseInt(match[1]!, 10);
	const unit = match[2]!;
	
	const multipliers: Record<string, number> = {
		s: 1000,
		m: 60 * 1000,
		h: 60 * 60 * 1000,
		d: 24 * 60 * 60 * 1000
	};
	
	return value * multipliers[unit]!;
}

// ═══════════════════════════════════════════════
// Errors
// ═══════════════════════════════════════════════

export class AuthError extends Error {
	constructor(
		public code: string,
		message: string,
		public statusCode = 401
	) {
		super(message);
		this.name = 'AuthError';
	}
}