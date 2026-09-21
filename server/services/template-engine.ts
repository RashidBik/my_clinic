import { z } from 'zod';
import { eq, and, sql, desc } from 'drizzle-orm';
import { db, sqlite } from '../db/client.js';
import { createId } from '@paralleldrive/cuid2';

import { users, members, roles, categories, organizations } from '../db/schema/core.js';
import {
	templates,
	type TemplateField,
	type TemplateAction
} from '../db/schema/templates.js';
import {
	records,
	recordSteps,
	workflows,
	workflowSteps
} from '../db/schema/records.js';
import { chatMessages } from '../db/schema/chat.js';
import { payments } from '../db/schema/finance.js';
import {
	inventoryItems,
	inventoryTransactions
} from '../db/schema/inventory.js';
import { auditLogs, operations } from '../db/schema/audit.js';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface ExecuteTemplateInput {
	organizationId: string;
	userId: string;
	templateId: string;
	data: Record<string, unknown>;
	clientOperationId: string; // برای Idempotency
}

export interface ExecuteTemplateResult {
	recordId: string;
	recordStepId: string | null;
	paymentId: string | null;
	chatMessageId: string;
	referenceCode: string;
	renderedContent: string;
}

export class TemplateError extends Error {
	constructor(
		public code: string,
		message: string,
		public statusCode = 400
	) {
		super(message);
		this.name = 'TemplateError';
	}
}

// ═══════════════════════════════════════════════
// Main: Execute Template
// ═══════════════════════════════════════════════

export async function executeTemplate(
	input: ExecuteTemplateInput
): Promise<ExecuteTemplateResult> {
	// 1. Idempotency Check
	const existing = await db
		.select()
		.from(operations)
		.where(eq(operations.id, input.clientOperationId))
		.limit(1);

	if (existing.length > 0 && existing[0]!.result) {
		// قبلاً اجرا شده → همان نتیجه را برگردان
		return existing[0]!.result as unknown as ExecuteTemplateResult;
	}

	// 2. Load Template
	const [template] = await db
		.select()
		.from(templates)
		.where(
			and(
				eq(templates.id, input.templateId),
				eq(templates.organizationId, input.organizationId),
				eq(templates.isActive, true)
			)
		)
		.limit(1);

	if (!template) {
		throw new TemplateError('TEMPLATE_NOT_FOUND', 'قالب یافت نشد', 404);
	}

	// 3. Validate Data against Fields
	const validatedData = validateTemplateData(template.fields, input.data);

	// 4. Render Content
	const renderedContent = renderTemplateText(template.textTemplate, validatedData);

	// 5. Transaction — همه یا هیچ
	let result: ExecuteTemplateResult;

	try {
		result = sqlite.transaction(() => {
			return executeActionsSync({
				template,
				data: validatedData,
				renderedContent,
				organizationId: input.organizationId,
				userId: input.userId,
				clientOperationId: input.clientOperationId
			});
		})();
	} catch (error) {
		if (error instanceof TemplateError) throw error;
		throw new TemplateError(
			'EXECUTION_FAILED',
			error instanceof Error ? error.message : 'خطا در اجرا',
			500
		);
	}

	return result;
}

// ═══════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════

function validateTemplateData(
	fields: TemplateField[],
	data: Record<string, unknown>
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	const errors: Record<string, string[]> = {};

	for (const field of fields) {
		const value = data[field.key];

		// Required check
		if (field.required && (value === undefined || value === null || value === '')) {
			errors[field.key] = ['این فیلد الزامی است'];
			continue;
		}

		// Skip if empty & optional
		if (value === undefined || value === null || value === '') {
			if (field.defaultValue !== undefined) {
				result[field.key] = field.defaultValue;
			}
			continue;
		}

		// Type validation
		try {
			result[field.key] = validateFieldValue(field, value);
		} catch (err) {
			errors[field.key] = [err instanceof Error ? err.message : 'مقدار نامعتبر'];
		}
	}

	if (Object.keys(errors).length > 0) {
		throw new TemplateError(
			'VALIDATION_ERROR',
			'اطلاعات ورودی نامعتبر',
			400
		);
	}

	return result;
}

function validateFieldValue(field: TemplateField, value: unknown): unknown {
	switch (field.type) {

		case 'text':
		case 'textarea': {
			const str = String(value).trim();
			const validation = field.validation as { minLength?: number; maxLength?: number } | undefined;
			if (validation?.minLength && str.length < validation.minLength) {
				throw new Error(`حداقل ${validation.minLength} کاراکتر`);
			}
			if (validation?.maxLength && str.length > validation.maxLength) {
				throw new Error(`حداکثر ${validation.maxLength} کاراکتر`);
			}
			return str;
		}

		case 'number':
		case 'currency': {
			const num = Number(value);
			if (isNaN(num)) throw new Error('عدد نامعتبر');
			const validation = field.validation as { min?: number; max?: number } | undefined;
			if (validation?.min !== undefined && num < validation.min) {
				throw new Error(`حداقل ${validation.min}`);
			}
			if (validation?.max !== undefined && num > validation.max) {
				throw new Error(`حداکثر ${validation.max}`);
			}
			return num;
		}

		case 'select': {
			const str = String(value);
			const valid = field.options?.some((o) => o.value === str);
			if (!valid) throw new Error('گزینه نامعتبر');
			return str;
		}
		case 'hidden': return value;

		case 'boolean':
			return Boolean(value);

		case 'inventory_picker': {
			// اگر Array است، حالت قدیمی (consumedItems)
			if (Array.isArray(value)) {
				return value.map((item) => {
					const obj = item as Record<string, unknown>;
					return {
						itemId: String(obj.itemId),
						quantity: Number(obj.quantity)
					};
				});
			}

			// اگر String است، یعنی یک Item انتخاب شده
			return String(value);
		}

		case 'product_picker':
			return String(value);

		case 'patient_picker':
		case 'user_picker':
			return String(value);

		default:
			return value;
	}
}

// ═══════════════════════════════════════════════
// Render Text
// ═══════════════════════════════════════════════

function renderTemplateText(
	template: string,
	data: Record<string, unknown>
): string {
	return template.replace(/\{(\w+)\}/g, (match, key) => {
		const value = data[key];
		if (value === undefined || value === null) return match;
		
		// Arrays (مثل consumedItems)
		if (Array.isArray(value)) {
			if (value.length === 0) return 'چیزی';
			return value.map((v) => {
				const item = v as { quantity?: number; name?: string };
				return `${item.quantity || 1} عدد ${item.name || ''}`;
			}).join(' و ');
		}

		// Objects
		if (typeof value === 'object') {
			return JSON.stringify(value);
		}

		// Numbers: حذف اعشار اضافه
		if (typeof value === 'number') {
			return Number.isInteger(value) ? String(value) : value.toFixed(2);
		}

		return String(value);
	});
}

// ═══════════════════════════════════════════════
// Execute Actions (Sync — داخل Transaction)
// ═══════════════════════════════════════════════

interface ExecuteActionsInput {
	template: typeof templates.$inferSelect;
	data: Record<string, unknown>;
	renderedContent: string;
	organizationId: string;
	userId: string;
	clientOperationId: string;
}

function executeActionsSync(input: ExecuteActionsInput): ExecuteTemplateResult {
	const { template, data, renderedContent, organizationId, userId, clientOperationId } = input;

	// ترتیب: Actions با sortOrder
	const actions = [...template.actions].sort((a, b) => a.sortOrder - b.sortOrder);

	let recordId: string | null = null;
	let recordStepId: string | null = null;
	let paymentId: string | null = null;
	let referenceCode = '';
	const context: Record<string, unknown> = {};

	// اجرای Actions
	for (const action of actions) {
		const result = executeAction(action, {
			template,
			data,
			renderedContent,
			organizationId,
			userId,
			context,
			recordId,
			referenceCode
		});

		// جمع‌آوری نتایج
		if (result.recordId) recordId = result.recordId;
		if (result.recordStepId) recordStepId = result.recordStepId;
		if (result.paymentId) paymentId = result.paymentId;
		if (result.referenceCode) referenceCode = result.referenceCode;

		Object.assign(context, result.context);
	}

		if (recordId) {
		db.update(records)
			.set({
				metadata: data, // ← کل داده را ذخیره کن
				updatedAt: new Date()
			})
			.where(eq(records.id, recordId))
			.run();
		}

	// ساخت Chat Message
	const chatMessageId = createChatMessage({
		organizationId,
		userId,
		content: renderedContent,
		messageType: 'operational',
		recordId,
		templateId: template.id,
		templateData: data
	});

	// Audit Log
	createAuditLog({
		organizationId,
		userId,
		action: 'create',
		entityType: 'record',
		entityId: recordId ?? chatMessageId,
		newValue: { template: template.slug, data }
	});

	// Idempotency — ذخیره نتیجه
	const result: ExecuteTemplateResult = {
		recordId: recordId ?? '',
		recordStepId,
		paymentId,
		chatMessageId,
		referenceCode,
		renderedContent
	};

	db.insert(operations)
		.values({
			id: clientOperationId,
			organizationId,
			userId,
			result: result as unknown as Record<string, unknown>
		})
		.run();

	return result;
}

// ═══════════════════════════════════════════════
// Execute Single Action
// ═══════════════════════════════════════════════

interface ActionContext {
	template: typeof templates.$inferSelect;
	data: Record<string, unknown>;
	renderedContent: string;
	organizationId: string;
	userId: string;
	context: Record<string, unknown>;
	recordId: string | null;
	referenceCode: string;
}

interface ActionResult {
	recordId?: string;
	recordStepId?: string;
	paymentId?: string;
	referenceCode?: string;
	context?: Record<string, unknown>;
}

function executeAction(action: TemplateAction, ctx: ActionContext): ActionResult {
	const config = action.config;

	switch (action.type) {
		// ─────────────────────────────────────────
		// Create Record
		// ─────────────────────────────────────────
		case 'create_record': {
			const workflowSlug = String(config.workflowSlug || '');
			const categorySlug = String(config.categorySlug || '');

			// Find workflow
			const [workflow] = db
				.select()
				.from(workflows)
				.where(
					and(
						eq(workflows.organizationId, ctx.organizationId),
						eq(workflows.slug, workflowSlug)
					)
				)
				.limit(1)
				.all();

			// Find first step
			let firstStepId: string | null = null;
			let assignedRoleId: string | null = null;

			if (workflow) {
				const [firstStep] = db
					.select()
					.from(workflowSteps)
					.where(eq(workflowSteps.workflowId, workflow.id))
					.orderBy(workflowSteps.stepOrder)
					.limit(1)
					.all();

				firstStepId = firstStep?.id ?? null;
				assignedRoleId = firstStep?.roleId ?? null;
			}

			// Generate reference code
			const refCode = generateReferenceCode(ctx.organizationId);

			// Find category
			const [category] = db
				.select()
				.from(categories)
				.where(
					and(
						eq(categories.organizationId, ctx.organizationId),
						eq(categories.slug, categorySlug)
					)
				)
				.limit(1)
				.all();

			const recordId = createId();
			const now = new Date();

			db.insert(records)
				.values({
					id: recordId,
					organizationId: ctx.organizationId,
					workflowId: workflow?.id ?? null,
					currentStepId: firstStepId,
					referenceCode: refCode,
					status: 'waiting',
					assignedToRoleId: assignedRoleId,
					visibleToRoles: assignedRoleId ? [assignedRoleId] : [],
					visibleToUsers: [ctx.userId],
					createdBy: ctx.userId,
					createdAt: now,
					updatedAt: now
				})
				.run();

			return {
				recordId,
				referenceCode: refCode,
				context: { categoryId: category?.id }
			};
		}

		// ─────────────────────────────────────────
		// Create Record Step
		// ─────────────────────────────────────────
		case 'create_record_step': {
			if (!ctx.recordId) return {};

			const categorySlug = String(config.categorySlug || '');

			const [category] = db
				.select()
				.from(categories)
				.where(
					and(
						eq(categories.organizationId, ctx.organizationId),
						eq(categories.slug, categorySlug)
					)
				)
				.limit(1)
				.all();

			if (!category) return {};

			const stepId = createId();
			const now = new Date();

			db.insert(recordSteps)
				.values({
					id: stepId,
					recordId: ctx.recordId,
					categoryId: category.id,
					status: 'completed',
					data: ctx.data,
					startedAt: now,
					completedAt: now,
					completedBy: ctx.userId
				})
				.run();

			return { recordStepId: stepId };
		}

		// ─────────────────────────────────────────
		// Create Payment
		// ─────────────────────────────────────────
		case 'create_payment': {
			const amountField = String(config.amountField || 'amount');
			const methodField = String(config.methodField || 'paymentMethod');
			const categorySlug = config.categorySlug ? String(config.categorySlug) : null;

			const amount = Number(ctx.data[amountField] || 0);
			const method = String(ctx.data[methodField] || 'cash');

			if (amount <= 0) return {};

			let categoryId: string | null = null;
			if (categorySlug) {
				const [cat] = db
					.select()
					.from(categories)
					.where(
						and(
							eq(categories.organizationId, ctx.organizationId),
							eq(categories.slug, categorySlug)
						)
					)
					.limit(1)
					.all();
				categoryId = cat?.id ?? null;
			}

			const paymentId = createId();
			const now = new Date();

			db.insert(payments)
				.values({
					id: paymentId,
					organizationId: ctx.organizationId,
					recordId: ctx.recordId,
					categoryId,
					amount,
					currency: 'AFN',
					paymentMethod: method,
					createdBy: ctx.userId,
					createdAt: now
				})
				.run();

			return { paymentId };
		}

		// ─────────────────────────────────────────
		// Consume Inventory (Single Item)
		// ─────────────────────────────────────────
		case 'consume_inventory': {
			// دو حالت: itemField + quantityField (single) یا itemsField (array)
			const itemsField = config.itemsField ? String(config.itemsField) : null;
			const itemField = config.itemField ? String(config.itemField) : null;
			const quantityField = config.quantityField ? String(config.quantityField) : null;

			const items: Array<{ itemId: string; quantity: number }> = [];

			// حالت Array
			if (itemsField) {
				const arr = ctx.data[itemsField];
				if (Array.isArray(arr)) {
					for (const item of arr) {
						const obj = item as Record<string, unknown>;
						items.push({
							itemId: String(obj.itemId),
							quantity: Number(obj.quantity)
						});
					}
				}
			}

			// حالت Single
			if (itemField && quantityField) {
				const itemId = String(ctx.data[itemField] || '');
				const quantity = Number(ctx.data[quantityField] || 0);
				if (itemId && quantity > 0) {
					items.push({ itemId, quantity });
				}
			}

			// اجرای کاهش موجودی
			for (const item of items) {
				if (!item.itemId || item.quantity <= 0) continue;

				// Find item
				const [invItem] = db
					.select()
					.from(inventoryItems)
					.where(
						and(
							eq(inventoryItems.id, item.itemId),
							eq(inventoryItems.organizationId, ctx.organizationId)
						)
					)
					.limit(1)
					.all();

				if (!invItem) continue;

				// Check stock
				if (invItem.quantity < item.quantity) {
					throw new TemplateError(
						'INSUFFICIENT_STOCK',
						`موجودی ${invItem.name} کافی نیست`,
						400
					);
				}

				// Decrement
				const now = new Date();
				db.update(inventoryItems)
					.set({
						quantity: invItem.quantity - item.quantity,
						updatedAt: now
					})
					.where(eq(inventoryItems.id, item.itemId))
					.run();

				// Transaction log
				db.insert(inventoryTransactions)
					.values({
						id: createId(),
						organizationId: ctx.organizationId,
						itemId: item.itemId,
						type: 'consume',
						quantity: -item.quantity,
						recordId: ctx.recordId,
						userId: ctx.userId,
						createdAt: now
					})
					.run();
			}

			return {};
		}

		// ─────────────────────────────────────────
		// Assign to Role
		// ─────────────────────────────────────────
		case 'assign_to_role': {
			if (!ctx.recordId) return {};

			const roleSlug = String(config.roleSlug || '');

			const [role] = db
				.select()
				.from(roles)
				.where(
					and(
						eq(roles.organizationId, ctx.organizationId),
						eq(roles.slug, roleSlug)
					)
				)
				.limit(1)
				.all();

			if (!role) return {};

			db.update(records)
				.set({
					assignedToRoleId: role.id,
					visibleToRoles: [role.id],
					updatedAt: new Date()
				})
				.where(eq(records.id, ctx.recordId))
				.run();

			return {};
		}

		// ─────────────────────────────────────────
		// Update Record Status
		// ─────────────────────────────────────────
		case 'update_record_status': {
			if (!ctx.recordId) return {};

			const status = String(config.status || 'waiting');

			db.update(records)
				.set({
					status,
					completedAt: status === 'completed' ? new Date() : null,
					updatedAt: new Date()
				})
				.where(eq(records.id, ctx.recordId))
				.run();

			return {};
		}

		// ─────────────────────────────────────────
		// Default
		// ─────────────────────────────────────────
		default:
			return {};
	}
}

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function generateReferenceCode(organizationId: string): string {
	const today = new Date();
	const prefix = `C${today.getFullYear().toString().slice(-2)}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

	const [row] = db
		.select({ count: sql<number>`count(*)` })
		.from(records)
		.where(eq(records.organizationId, organizationId))
		.all();

	const num = (row?.count ?? 0) + 1;
	return `${prefix}-${String(num).padStart(4, '0')}`;
}

interface CreateChatMessageInput {
	organizationId: string;
	userId: string;
	content: string;
	messageType: 'normal' | 'operational' | 'system';
	recordId?: string | null;
	templateId?: string | null;
	templateData?: Record<string, unknown>;
}

function createChatMessage(input: CreateChatMessageInput): string {
	const id = createId();
	const now = new Date();

	db.insert(chatMessages)
		.values({
			id,
			organizationId: input.organizationId,
			senderId: input.userId,
			messageType: input.messageType,
			content: input.content,
			recordId: input.recordId ?? null,
			templateId: input.templateId ?? null,
			templateData: input.templateData ?? null,
			createdAt: now
		})
		.run();

	return id;
}

interface CreateAuditLogInput {
	organizationId: string;
	userId: string;
	action: string;
	entityType: string;
	entityId: string;
	oldValue?: Record<string, unknown>;
	newValue?: Record<string, unknown>;
}

function createAuditLog(input: CreateAuditLogInput): void {
	db.insert(auditLogs)
		.values({
			id: createId(),
			organizationId: input.organizationId,
			userId: input.userId,
			action: input.action,
			entityType: input.entityType,
			entityId: input.entityId,
			oldValue: input.oldValue ?? null,
			newValue: input.newValue ?? null,
			createdAt: new Date()
		})
		.run();
}

// ═══════════════════════════════════════════════
// Continue Record — اضافه به انتهای فایل
// ═══════════════════════════════════════════════

export interface ContinueRecordInput {
	organizationId: string;
	userId: string;
	roleId: string;
	baseRole: string;
	recordId: string;
	templateId: string;
	data: Record<string, unknown>;
	clientOperationId: string;
}

export async function continueRecord(
	input: ContinueRecordInput
): Promise<ExecuteTemplateResult> {
	// 1. Idempotency
	const existing = await db
		.select()
		.from(operations)
		.where(eq(operations.id, input.clientOperationId))
		.limit(1);

	if (existing.length > 0 && existing[0]!.result) {
		return existing[0]!.result as unknown as ExecuteTemplateResult;
	}

	// 2. Load Record
	const [record] = await db
		.select()
		.from(records)
		.where(
			and(
				eq(records.id, input.recordId),
				eq(records.organizationId, input.organizationId)
			)
		)
		.limit(1);

	if (!record) {
		throw new TemplateError('RECORD_NOT_FOUND', 'پرونده یافت نشد', 404);
	}

	// 3. Check Permission
	const canContinue =
		input.baseRole === 'manager' ||
		record.createdBy === input.userId ||
		record.assignedToRoleId === input.roleId;

	if (!canContinue) {
		throw new TemplateError(
			'FORBIDDEN',
			'شما دسترسی به این پرونده ندارید',
			403
		);
	}

	// 4. Check Status
	if (record.status === 'completed' || record.status === 'cancelled') {
		throw new TemplateError(
			'RECORD_CLOSED',
			'این پرونده بسته شده است',
			400
		);
	}

	// 5. Load Template
	const [template] = await db
		.select()
		.from(templates)
		.where(
			and(
				eq(templates.id, input.templateId),
				eq(templates.organizationId, input.organizationId),
				eq(templates.isActive, true)
			)
		)
		.limit(1);

	if (!template) {
		throw new TemplateError('TEMPLATE_NOT_FOUND', 'قالب یافت نشد', 404);
	}

	// 6. Validate Data
	const validatedData = validateTemplateData(template.fields, input.data);

	// 7. Merge Patient Info از Metadata
	const metadata = (record.metadata as Record<string, unknown>) || {};
	const mergedData: Record<string, unknown> = {
		...metadata, // Patient Name از قبل
		...validatedData // Data جدید
	};

	// 8. Render Content
	const renderedContent = renderTemplateText(template.textTemplate, mergedData);

	// 9. Execute in Transaction
	let result: ExecuteTemplateResult;

	try {
		result = sqlite.transaction(() => {
			return executeContinueActionsSync({
				template,
				data: mergedData,
				renderedContent,
				organizationId: input.organizationId,
				userId: input.userId,
				record,
				clientOperationId: input.clientOperationId
			});
		})();
	} catch (error) {
		if (error instanceof TemplateError) throw error;
		throw new TemplateError(
			'EXECUTION_FAILED',
			error instanceof Error ? error.message : 'خطا در اجرا',
			500
		);
	}

	return result;
}

// ═══════════════════════════════════════════════
// Execute Continue Actions (Sync)
// ═══════════════════════════════════════════════

interface ExecuteContinueInput {
	template: typeof templates.$inferSelect;
	data: Record<string, unknown>;
	renderedContent: string;
	organizationId: string;
	userId: string;
	record: typeof records.$inferSelect;
	clientOperationId: string;
}

function executeContinueActionsSync(
	input: ExecuteContinueInput
): ExecuteTemplateResult {
	const { template, data, renderedContent, organizationId, userId, record, clientOperationId } = input;

	const actions = [...template.actions].sort((a, b) => a.sortOrder - b.sortOrder);

	let recordStepId: string | null = null;
	let paymentId: string | null = null;
	let newStatus = record.status;
	let newAssignedRoleId = record.assignedToRoleId;
	let nextStepId = record.currentStepId;

	const context: Record<string, unknown> = {
		existingMetadata: record.metadata || {}
	};

	// Execute Actions
	for (const action of actions) {
		const result = executeContinueAction(action, {
			template,
			data,
			renderedContent,
			organizationId,
			userId,
			record,
			context
		});

		if (result.recordStepId) recordStepId = result.recordStepId;
		if (result.paymentId) paymentId = result.paymentId;
		if (result.newStatus) newStatus = result.newStatus;
		if (result.newAssignedRoleId) newAssignedRoleId = result.newAssignedRoleId;
		if (result.nextStepId) nextStepId = result.nextStepId;

		Object.assign(context, result.context);
	}

	// Merge Metadata — داده Patient و ... ذخیره شود
	const newMetadata = {
		...(record.metadata as Record<string, unknown> || {}),
		...data
	};

	// Update Record
	const now = new Date();
	db.update(records)
		.set({
			status: newStatus,
			assignedToRoleId: newAssignedRoleId,
			visibleToRoles: newAssignedRoleId ? [newAssignedRoleId] : [],
			currentStepId: nextStepId,
			metadata: newMetadata,
			updatedAt: now,
			completedAt: newStatus === 'completed' ? now : null
		})
		.where(eq(records.id, record.id))
		.run();

	// Create Chat Message
	const chatMessageId = createChatMessage({
		organizationId,
		userId,
		content: renderedContent,
		messageType: 'operational',
		recordId: record.id,
		templateId: template.id,
		templateData: data
	});

	// Audit Log
	createAuditLog({
		organizationId,
		userId,
		action: 'continue',
		entityType: 'record',
		entityId: record.id,
		oldValue: { status: record.status, metadata: record.metadata },
		newValue: { status: newStatus, metadata: newMetadata }
	});

	// Result
	const result: ExecuteTemplateResult = {
		recordId: record.id,
		recordStepId,
		paymentId,
		chatMessageId,
		referenceCode: record.referenceCode,
		renderedContent
	};

	// Idempotency
	db.insert(operations)
		.values({
			id: clientOperationId,
			organizationId,
			userId,
			result: result as unknown as Record<string, unknown>
		})
		.run();

	return result;
}

// ═══════════════════════════════════════════════
// Execute Continue Action
// ═══════════════════════════════════════════════

interface ContinueActionContext {
	template: typeof templates.$inferSelect;
	data: Record<string, unknown>;
	renderedContent: string;
	organizationId: string;
	userId: string;
	record: typeof records.$inferSelect;
	context: Record<string, unknown>;
}

interface ContinueActionResult {
	recordStepId?: string;
	paymentId?: string;
	newStatus?: string;
	newAssignedRoleId?: string;
	nextStepId?: string;
	context?: Record<string, unknown>;
}

function executeContinueAction(
	action: TemplateAction,
	ctx: ContinueActionContext
): ContinueActionResult {
	const config = action.config;

	switch (action.type) {
		// ─────────────────────────────────────────
		// Create Record Step
		// ─────────────────────────────────────────
		case 'create_record_step': {
			const categorySlug = String(config.categorySlug || '');

			const [category] = db
				.select()
				.from(categories)
				.where(
					and(
						eq(categories.organizationId, ctx.organizationId),
						eq(categories.slug, categorySlug)
					)
				)
				.limit(1)
				.all();

			if (!category) return {};

			const stepId = createId();
			const now = new Date();

			db.insert(recordSteps)
				.values({
					id: stepId,
					recordId: ctx.record.id,
					categoryId: category.id,
					status: 'completed',
					data: ctx.data,
					startedAt: now,
					completedAt: now,
					completedBy: ctx.userId
				})
				.run();

			return { recordStepId: stepId };
		}

		// ─────────────────────────────────────────
		// Create Payment
		// ─────────────────────────────────────────
		case 'create_payment': {
			const amountField = String(config.amountField || 'amount');
			const methodField = String(config.methodField || 'paymentMethod');
			const categorySlug = config.categorySlug ? String(config.categorySlug) : null;

			const amount = Number(ctx.data[amountField] || 0);
			const method = String(ctx.data[methodField] || 'cash');

			if (amount <= 0) return {};

			let categoryId: string | null = null;
			if (categorySlug) {
				const [cat] = db
					.select()
					.from(categories)
					.where(
						and(
							eq(categories.organizationId, ctx.organizationId),
							eq(categories.slug, categorySlug)
						)
					)
					.limit(1)
					.all();
				categoryId = cat?.id ?? null;
			}

			const paymentId = createId();

			db.insert(payments)
				.values({
					id: paymentId,
					organizationId: ctx.organizationId,
					recordId: ctx.record.id,
					categoryId,
					amount,
					currency: 'AFN',
					paymentMethod: method,
					createdBy: ctx.userId,
					createdAt: new Date()
				})
				.run();

			return { paymentId };
		}

		// ⭐⭐⭐ این بخش مهم است ⭐⭐⭐
		// ─────────────────────────────────────────
		// Consume Inventory
		// ─────────────────────────────────────────
		case 'consume_inventory': {
			console.log('🔥 consume_inventory called (Continue)');
			console.log('🔥 config:', JSON.stringify(config));
			console.log('🔥 data:', JSON.stringify(ctx.data));

			const itemsField = config.itemsField ? String(config.itemsField) : null;
			const itemField = config.itemField ? String(config.itemField) : null;
			const quantityField = config.quantityField ? String(config.quantityField) : null;

			const items: Array<{ itemId: string; quantity: number }> = [];

			// حالت Array (consumedItems)
			if (itemsField) {
				const arr = ctx.data[itemsField];
				if (Array.isArray(arr)) {
					for (const item of arr) {
						const obj = item as Record<string, unknown>;
						items.push({
							itemId: String(obj.itemId),
							quantity: Number(obj.quantity)
						});
					}
				}
			}

			// حالت Single (medicine + quantity)
			if (itemField && quantityField) {
				const itemId = String(ctx.data[itemField] || '');
				const quantity = Number(ctx.data[quantityField] || 0);

				console.log('🔥 Single mode:', { itemField, itemId, quantityField, quantity });

				if (itemId && quantity > 0) {
					items.push({ itemId, quantity });
				}
			}

			console.log('🔥 Items to consume:', JSON.stringify(items));

			if (items.length === 0) {
				console.log('⚠️ No items to consume!');
				return {};
			}

			for (const item of items) {
				if (!item.itemId || item.quantity <= 0) continue;

				const [invItem] = db
					.select()
					.from(inventoryItems)
					.where(
						and(
							eq(inventoryItems.id, item.itemId),
							eq(inventoryItems.organizationId, ctx.organizationId)
						)
					)
					.limit(1)
					.all();

				if (!invItem) {
					console.log('❌ Item not found:', item.itemId);
					continue;
				}

				console.log('✅ Found item:', invItem.name, 'current qty:', invItem.quantity);

				if (invItem.quantity < item.quantity) {
					throw new TemplateError(
						'INSUFFICIENT_STOCK',
						`موجودی ${invItem.name} کافی نیست`,
						400
					);
				}

				const now = new Date();
				db.update(inventoryItems)
					.set({
						quantity: invItem.quantity - item.quantity,
						updatedAt: now
					})
					.where(eq(inventoryItems.id, item.itemId))
					.run();

				console.log('✅ Decremented:', invItem.name, '→', invItem.quantity - item.quantity);

				db.insert(inventoryTransactions)
					.values({
						id: createId(),
						organizationId: ctx.organizationId,
						itemId: item.itemId,
						type: 'consume',
						quantity: -item.quantity,
						recordId: ctx.record.id,
						userId: ctx.userId,
						createdAt: now
					})
					.run();
			}

			return {};
		}

		// ─────────────────────────────────────────
		// Assign to Role
		// ─────────────────────────────────────────
		case 'assign_to_role': {
			const roleSlug = String(config.roleSlug || '');

			const [role] = db
				.select()
				.from(roles)
				.where(
					and(
						eq(roles.organizationId, ctx.organizationId),
						eq(roles.slug, roleSlug)
					)
				)
				.limit(1)
				.all();

			if (!role) return {};

			let nextStepId: string | undefined;
			if (ctx.record.workflowId) {
				const [currentStep] = db
					.select()
					.from(workflowSteps)
					.where(eq(workflowSteps.id, ctx.record.currentStepId || ''))
					.limit(1)
					.all();

				if (currentStep) {
					const [nextStep] = db
						.select()
						.from(workflowSteps)
						.where(
							and(
								eq(workflowSteps.workflowId, ctx.record.workflowId),
								sql`${workflowSteps.stepOrder} > ${currentStep.stepOrder}`
							)
						)
						.orderBy(workflowSteps.stepOrder)
						.limit(1)
						.all();

					nextStepId = nextStep?.id;
				}
			}

			return {
				newAssignedRoleId: role.id,
				nextStepId
			};
		}

		// ─────────────────────────────────────────
		// Update Record Status
		// ─────────────────────────────────────────
		case 'update_record_status': {
			const status = String(config.status || 'waiting');
			return { newStatus: status };
		}

		default:
			return {};
	}
}