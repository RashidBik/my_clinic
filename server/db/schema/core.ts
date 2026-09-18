import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ═══════════════════════════════════════════════
// Organizations
// ═══════════════════════════════════════════════

export const organizations = sqliteTable('organizations', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	type: text('type').notNull(), // clinic, store, company, ...
	presetId: text('preset_id'),
	settings: text('settings', { mode: 'json' }).$type<Record<string, unknown>>(),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// ═══════════════════════════════════════════════
// Users
// ═══════════════════════════════════════════════

export const users = sqliteTable('users', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	phone: text('phone').notNull().unique(),
	name: text('name').notNull(),
	avatar: text('avatar'),
	passwordHash: text('password_hash'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	phoneIdx: index('users_phone_idx').on(table.phone)
}));

// ═══════════════════════════════════════════════
// Members (User ↔ Organization)
// ═══════════════════════════════════════════════

export const members = sqliteTable('members', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	organizationId: text('organization_id').notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	roleId: text('role_id').notNull()
		.references(() => roles.id, { onDelete: 'restrict' }),
	isMember: integer('is_member', { mode: 'boolean' }).notNull().default(true),
	status: text('status').notNull().default('active'), // active, inactive, suspended
	joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	orgUserIdx: uniqueIndex('members_org_user_idx').on(table.organizationId, table.userId),
	orgIdx: index('members_org_idx').on(table.organizationId),
	userIdx: index('members_user_idx').on(table.userId)
}));

// ═══════════════════════════════════════════════
// Roles
// ═══════════════════════════════════════════════

export const roles = sqliteTable('roles', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	organizationId: text('organization_id').notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	name: text('name').notNull(), // Doctor, Pharmacist, ...
	slug: text('slug').notNull(),
	baseRole: text('base_role').notNull(), // manager, reporter, operator
	description: text('description'),
	permissions: text('permissions', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
	isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	orgSlugIdx: uniqueIndex('roles_org_slug_idx').on(table.organizationId, table.slug),
	orgIdx: index('roles_org_idx').on(table.organizationId)
}));

// ═══════════════════════════════════════════════
// Categories
// ═══════════════════════════════════════════════

export const categories = sqliteTable('categories', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	organizationId: text('organization_id').notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	parentId: text('parent_id'),
	name: text('name').notNull(),
	slug: text('slug').notNull(),
	description: text('description'),
	icon: text('icon'),
	color: text('color'),
	sortOrder: integer('sort_order').notNull().default(0),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	orgSlugIdx: uniqueIndex('categories_org_slug_idx').on(table.organizationId, table.slug),
	orgIdx: index('categories_org_idx').on(table.organizationId),
	parentIdx: index('categories_parent_idx').on(table.parentId)
}));

// ═══════════════════════════════════════════════
// Relations
// ═══════════════════════════════════════════════

export const organizationsRelations = relations(organizations, ({ many }) => ({
	members: many(members),
	roles: many(roles),
	categories: many(categories)
}));

export const usersRelations = relations(users, ({ many }) => ({
	memberships: many(members)
}));

export const membersRelations = relations(members, ({ one }) => ({
	organization: one(organizations, {
		fields: [members.organizationId],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [members.userId],
		references: [users.id]
	}),
	role: one(roles, {
		fields: [members.roleId],
		references: [roles.id]
	})
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [roles.organizationId],
		references: [organizations.id]
	}),
	members: many(members)
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [categories.organizationId],
		references: [organizations.id]
	}),
	parent: one(categories, {
		fields: [categories.parentId],
		references: [categories.id],
		relationName: 'category_parent'
	}),
	children: many(categories, { relationName: 'category_parent' })
}));