import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users, members, roles, organizations } from '../db/schema/core.js';
import { verifyPassword, hashPassword } from './password.js';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface ProfileData {
	user: {
		id: string;
		name: string;
		phone: string;
		avatar: string | null;
		lastLoginAt: Date | null;
		createdAt: Date;
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
		joinedAt: Date;
		status: string;
	};
}

export interface UpdateProfileInput {
	name?: string;
	avatar?: string | null;
}

export interface ChangePasswordInput {
	currentPassword: string;
	newPassword: string;
}

// ═══════════════════════════════════════════════
// Get Profile
// ═══════════════════════════════════════════════

export async function getProfile(userId: string, orgId: string): Promise<ProfileData> {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!user) {
		throw new ProfileError('USER_NOT_FOUND', 'کاربر یافت نشد', 404);
	}

	const [membership] = await db
		.select({
			member: members,
			role: roles,
			org: organizations
		})
		.from(members)
		.innerJoin(roles, eq(members.roleId, roles.id))
		.innerJoin(organizations, eq(members.organizationId, organizations.id))
		.where(eq(members.userId, userId))
		.limit(1);

	if (!membership) {
		throw new ProfileError('MEMBERSHIP_NOT_FOUND', 'عضویت یافت نشد', 404);
	}

	return {
		user: {
			id: user.id,
			name: user.name,
			phone: user.phone,
			avatar: user.avatar,
			lastLoginAt: user.lastLoginAt,
			createdAt: user.createdAt
		},
		organization: {
			id: membership.org.id,
			name: membership.org.name,
			slug: membership.org.slug,
			type: membership.org.type
		},
		role: {
			id: membership.role.id,
			name: membership.role.name,
			slug: membership.role.slug,
			baseRole: membership.role.baseRole,
			permissions: membership.role.permissions || []
		},
		membership: {
			joinedAt: membership.member.joinedAt,
			status: membership.member.status
		}
	};
}

// ═══════════════════════════════════════════════
// Update Profile
// ═══════════════════════════════════════════════

export async function updateProfile(
	userId: string,
	input: UpdateProfileInput
): Promise<void> {
	const updates: Record<string, unknown> = {
		updatedAt: new Date()
	};

	if (input.name !== undefined) {
		const trimmed = input.name.trim();
		if (trimmed.length < 2 || trimmed.length > 100) {
			throw new ProfileError(
				'INVALID_NAME',
				'نام باید بین ۲ تا ۱۰۰ کاراکتر باشد',
				400
			);
		}
		updates.name = trimmed;
	}

	if (input.avatar !== undefined) {
		updates.avatar = input.avatar;
	}

	await db.update(users).set(updates).where(eq(users.id, userId));
}

// ═══════════════════════════════════════════════
// Change Password
// ═══════════════════════════════════════════════

export async function changePassword(
	userId: string,
	input: ChangePasswordInput
): Promise<void> {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!user || !user.passwordHash) {
		throw new ProfileError('USER_NOT_FOUND', 'کاربر یافت نشد', 404);
	}

	// بررسی رمز فعلی
	const valid = await verifyPassword(input.currentPassword, user.passwordHash);
	if (!valid) {
		throw new ProfileError(
			'INVALID_CURRENT_PASSWORD',
			'رمز عبور فعلی اشتباه است',
			400
		);
	}

	// اعتبارسنجی رمز جدید
	if (input.newPassword.length < 6 || input.newPassword.length > 100) {
		throw new ProfileError(
			'INVALID_PASSWORD',
			'رمز عبور باید حداقل ۶ کاراکتر باشد',
			400
		);
	}

	if (input.currentPassword === input.newPassword) {
		throw new ProfileError(
			'SAME_PASSWORD',
			'رمز جدید باید متفاوت باشد',
			400
		);
	}

	// ذخیره
	const passwordHash = await hashPassword(input.newPassword);

	await db
		.update(users)
		.set({
			passwordHash,
			updatedAt: new Date()
		})
		.where(eq(users.id, userId));
}

// ═══════════════════════════════════════════════
// Errors
// ═══════════════════════════════════════════════

export class ProfileError extends Error {
	constructor(
		public code: string,
		message: string,
		public statusCode = 400
	) {
		super(message);
		this.name = 'ProfileError';
	}
}