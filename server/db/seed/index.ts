import { db } from '../client.js';
import { sqlite } from '../client.js';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

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
import { CLINIC_TEMPLATES } from './templates/index.js';

// ═══════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════

const ORG_NAME = process.env.SEED_ORG_NAME || 'کلینیک نمونه';
const ORG_SLUG = process.env.SEED_ORG_SLUG || 'demo-clinic';

const ADMIN_PHONE = process.env.SEED_ADMIN_PHONE || '0700000000';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'مدیر سیستم';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123';

// ═══════════════════════════════════════════════
// Main Seed Function
// ═══════════════════════════════════════════════

async function seed() {
	console.log('🌱 Starting seed...');
	
	// 1. Check if already seeded
	const existingOrg = await db
		.select()
		.from(organizations)
		.where(eq(organizations.slug, ORG_SLUG))
		.limit(1);
	
	if (existingOrg.length > 0) {
		console.log('✅ Organization already exists, skipping seed');
		console.log(`   Org ID: ${existingOrg[0].id}`);
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
	
	console.log(`📦 Created organization: ${org.name} (${org.id})`);
	
	// 3. Create Roles
	const createdRoles = new Map<string, string>(); // slug → id
	
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
		
		createdRoles.set(role.slug, created.id);
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
		
		createdCategories.set(category.slug, created.id);
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
		
		createdWorkflows.set(workflow.slug, created.id);
		
		// Create steps
		for (const step of workflow.steps) {
			await db.insert(workflowSteps).values({
				workflowId: created.id,
				stepOrder: step.stepOrder,
				categoryId: createdCategories.get(step.categorySlug)!,
				roleId: step.roleSlug ? createdRoles.get(step.roleSlug) : null,
				name: step.name,
				description: step.description,
				isTerminal: step.isTerminal ?? false,
				isOptional: step.isOptional ?? false
			});
		}
	}
	
	console.log(`🔄 Created ${createdWorkflows.size} workflows`);
	
	// 6. Create Templates
	for (const template of CLINIC_TEMPLATES) {
		await db.insert(templates).values({
			organizationId: org.id,
			name: template.name,
			slug: template.slug,
			description: template.description,
			categoryId: template.categorySlug
				? createdCategories.get(template.categorySlug)
				: null,
			roleId: template.roleSlug ? createdRoles.get(template.roleSlug) : null,
			textTemplate: template.textTemplate,
			fields: template.fields,
			actions: template.actions,
			sortOrder: template.sortOrder
		});
	}
	
	console.log(`📝 Created ${CLINIC_TEMPLATES.length} templates`);
	
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
	
	console.log(`👤 Created admin user: ${admin.name} (${admin.phone})`);
	
	// 8. Add Admin as Member (Manager role)
	await db.insert(members).values({
		organizationId: org.id,
		userId: admin.id,
		roleId: createdRoles.get('manager')!,
		isMember: true,
		status: 'active'
	});
	
	console.log(`✅ Admin added as Manager`);
	
	console.log('');
	console.log('═══════════════════════════════════════');
	console.log('🎉 Seed completed successfully!');
	console.log('═══════════════════════════════════════');
	console.log('');
	console.log('📋 Login credentials:');
	console.log(`   Phone: ${ADMIN_PHONE}`);
	console.log(`   Password: ${ADMIN_PASSWORD}`);
	console.log('');
	console.log('⚠️  Change these credentials in production!');
	console.log('');
}

// ═══════════════════════════════════════════════
// Password Hashing (بدون وابستگی)
// ═══════════════════════════════════════════════

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString('hex');
	const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
	return `${salt}:${derivedKey.toString('hex')}`;
}

// ═══════════════════════════════════════════════
// Run
// ═══════════════════════════════════════════════

seed()
	.then(() => {
		console.log('✅ Done');
		sqlite.close();
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Seed failed:', error);
		sqlite.close();
		process.exit(1);
	});