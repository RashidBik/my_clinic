import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { env } from '../config/env.js';

// ═══════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════

const ACCESS_TOKEN_EXPIRES = env.JWT_ACCESS_EXPIRES; // "15m"
const REFRESH_TOKEN_EXPIRES = env.JWT_REFRESH_EXPIRES; // "30d"

const accessSecret = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_SECRET + '-refresh');

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface AccessTokenPayload extends JWTPayload {
	sub: string; // userId
	orgId: string;
	roleId: string;
	roleSlug: string;
	baseRole: string;
	permissions: string[];
	isMember: boolean;
}

export interface RefreshTokenPayload extends JWTPayload {
	sub: string; // userId
	jti: string; // token id (برای Revoke)
}

// ═══════════════════════════════════════════════
// Sign
// ═══════════════════════════════════════════════

export async function signAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): Promise<string> {
	return new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(ACCESS_TOKEN_EXPIRES)
		.setIssuer('clinic-platform')
		.setAudience('clinic-api')
		.sign(accessSecret);
}

export async function signRefreshToken(userId: string, tokenId: string): Promise<string> {
	return new SignJWT({ sub: userId, jti: tokenId })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(REFRESH_TOKEN_EXPIRES)
		.setIssuer('clinic-platform')
		.setAudience('clinic-refresh')
		.sign(refreshSecret);
}

// ═══════════════════════════════════════════════
// Verify
// ═══════════════════════════════════════════════

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
	const { payload } = await jwtVerify(token, accessSecret, {
		issuer: 'clinic-platform',
		audience: 'clinic-api'
	});
	return payload as AccessTokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
	const { payload } = await jwtVerify(token, refreshSecret, {
		issuer: 'clinic-platform',
		audience: 'clinic-refresh'
	});
	return payload as RefreshTokenPayload;
}