import { db, sqlite } from '../client.js';
import { eq } from 'drizzle-orm';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

import {
	organizations,
	users,
	roles,
	categories,
	members
} from '../schema/core.js';
import { templates } from '../schema/templates.js';
import { workflows, workflowSteps } from '../schema/records.js';

import { CLINIC_ROLES, CLINIC_CATEGORIES, CLINIC_WORKFLOWS } from './clinic-preset.js';
import { seedInventory } from './inventory.js';
import { CLINIC_TEMPLATES } from './templates/index.js';


const scrypt = promisify(scryptCallback);

// ═══════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════

const ORG_NAME = process.env.SEED_ORG_NAME || 'کلینیک نمونه';
const ORG_SLUG = process.env.SEED_ORG_SLUG || 'demo-clinic';

const ADMIN_PHONE = process.env.SEED_ADMIN_PHONE || '0700000000';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'مدیر سیستم';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123';

const RESET = process.argv.includes('--reset');

// ═══════════════════════════════════════════════
// Password Hash
// ═══════════════════════════════════════════════

async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString('hex');
	const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
	return `${salt}:${derivedKey.toString('hex')}`;
}

// ═══════════════════════════════════════════════
// Main Seed
// ═══════════════════════════════════════════════

async function seed() {
	console.log('🌱 Starting seed...');

	// Reset اگر --reset داده شده
	if (RESET) {
		console.log('🗑️  Resetting organization...');
		await db.delete(organizations).where(eq(organizations.slug, ORG_SLUG));
	}

	// 1. Check if already seeded
	const existingOrg = await db
		.select()
		.from(organizations)
		.where(eq(organizations.slug, ORG_SLUG))
		.limit(1);

	if (existingOrg.length > 0) {
		console.log('✅ Organization already exists, skipping seed');
		console.log(`   Org ID: ${existingOrg[0]!.id}`);
		return;
	}

	// 2. Create Organization
	const [org] = await db
		.insert(organizations)
		.values({
			name: ORG_NAME,
			slug: ORG_SLUG,
			type: 'clinic',
			presetId: 'clinic',
			settings: {}
		})
		.returning();

	if (!org) throw new Error('Failed to create organization');
	console.log(`📦 Created organization: ${org.name} (${org.id})`);

	// 3. Create Roles
	const createdRoles = new Map<string, string>();
	for (const role of CLINIC_ROLES) {
		const [created] = await db
			.insert(roles)
			.values({
				organizationId: org.id,
				name: role.name,
				slug: role.slug,
				baseRole: role.baseRole,
				description: role.description,
				permissions: role.permissions as string[],
				isCustom: false,
				sortOrder: role.sortOrder
			})
			.returning();
		if (created) createdRoles.set(role.slug, created.id);
	}
	console.log(`🎭 Created ${createdRoles.size} roles`);

	// 4. Create Categories
	const createdCategories = new Map<string, string>();
	for (const category of CLINIC_CATEGORIES) {
		const [created] = await db
			.insert(categories)
			.values({
				organizationId: org.id,
				name: category.name,
				slug: category.slug,
				description: category.description,
				icon: category.icon,
				color: category.color,
				sortOrder: category.sortOrder,
				parentId: category.parentSlug
					? createdCategories.get(category.parentSlug)
					: null
			})
			.returning();
		if (created) createdCategories.set(category.slug, created.id);
	}
	console.log(`📂 Created ${createdCategories.size} categories`);

	// 5. Create Workflows
	const createdWorkflows = new Map<string, string>();
	for (const workflow of CLINIC_WORKFLOWS) {
		const [created] = await db
			.insert(workflows)
			.values({
				organizationId: org.id,
				name: workflow.name,
				slug: workflow.slug,
				description: workflow.description
			})
			.returning();

		if (!created) continue;
		createdWorkflows.set(workflow.slug, created.id);

		for (const step of workflow.steps) {
			const categoryId = createdCategories.get(step.categorySlug);
			if (!categoryId) continue;

			await db.insert(workflowSteps).values({
				workflowId: created.id,
				stepOrder: step.stepOrder,
				categoryId,
				roleId: step.roleSlug ? createdRoles.get(step.roleSlug) ?? null : null,
				name: step.name,
				description: step.description,
				isTerminal: step.isTerminal ?? false,
				isOptional: step.isOptional ?? false
			});
		}
	}
	console.log(`🔄 Created ${createdWorkflows.size} workflows`);

	// 6. Create Templates
	let templateCount = 0;
	for (const template of CLINIC_TEMPLATES) {
		const categoryId = template.categorySlug
			? createdCategories.get(template.categorySlug) ?? null
			: null;
		const roleId = template.roleSlug
			? createdRoles.get(template.roleSlug) ?? null
			: null;

		await db.insert(templates).values({
			organizationId: org.id,
			name: template.name,
			slug: template.slug,
			description: template.description,
			categoryId,
			roleId,
			textTemplate: template.textTemplate,
			fields: template.fields as any,
			actions: template.actions as any,
			sortOrder: template.sortOrder
		});
		templateCount++;
	}
	console.log(`📝 Created ${templateCount} templates`);

	// 7. Create Admin User
	const passwordHash = await hashPassword(ADMIN_PASSWORD);

	const [admin] = await db
		.insert(users)
		.values({
			phone: ADMIN_PHONE,
			name: ADMIN_NAME,
			passwordHash
		})
		.returning();

	if (!admin) throw new Error('Failed to create admin user');
	console.log(`👤 Created admin user: ${admin.name} (${admin.phone})`);
	await seedInventory(org.id);

	// 8. Add Admin as Manager
	const managerRoleId = createdRoles.get('manager');
	if (!managerRoleId) throw new Error('Manager role not found');

	await db.insert(members).values({
		organizationId: org.id,
		userId: admin.id,
		roleId: managerRoleId,
		isMember: true,
		status: 'active'
	});
	console.log(`✅ Admin added as Manager`);

	// Done
	console.log('');
	console.log('═══════════════════════════════════════');
	console.log('🎉 Seed completed successfully!');
	console.log('═══════════════════════════════════════');
	console.log('');
	console.log('📋 Login credentials:');
	console.log(`   Phone: ${ADMIN_PHONE}`);
	console.log(`   Password: ${ADMIN_PASSWORD}`);
	console.log('');
	console.log('📊 Created:');
	console.log(`   - 1 Organization`);
	console.log(`   - ${createdRoles.size} Roles`);
	console.log(`   - ${createdCategories.size} Categories`);
	console.log(`   - ${createdWorkflows.size} Workflows`);
	console.log(`   - ${templateCount} Templates`);
	console.log(`   - 1 Admin User`);
	console.log('');
	console.log('⚠️  Change credentials in production!');
	console.log('');
}

// ═══════════════════════════════════════════════
// Run
// ═══════════════════════════════════════════════

seed()
	.then(() => {
		sqlite.close();
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Seed failed:', error);
		sqlite.close();
		process.exit(1);
	});