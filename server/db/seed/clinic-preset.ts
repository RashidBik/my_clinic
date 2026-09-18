import { PERMISSIONS, type Permission } from './permissions.js';

export interface SeedRole {
	name: string;
	slug: string;
	baseRole: 'manager' | 'reporter' | 'operator';
	description: string;
	permissions: Permission[];
	sortOrder: number;
}

export const CLINIC_ROLES: SeedRole[] = [
	// ═══════════════════════════════════════════════
	// Manager
	// ═══════════════════════════════════════════════
	{
		name: 'مدیر',
		slug: 'manager',
		baseRole: 'manager',
		description: 'مدیر کلینیک — دسترسی کامل',
		sortOrder: 1,
		permissions: [
			// Organization — همه
			PERMISSIONS.ORG_VIEW,
			PERMISSIONS.ORG_EDIT,
			PERMISSIONS.ORG_MANAGE_MEMBERS,
			PERMISSIONS.ORG_MANAGE_ROLES,
			PERMISSIONS.ORG_MANAGE_CATEGORIES,
			PERMISSIONS.ORG_MANAGE_TEMPLATES,
			PERMISSIONS.ORG_MANAGE_WORKFLOWS,
			// Records — همه
			PERMISSIONS.RECORD_VIEW_ALL,
			PERMISSIONS.RECORD_CREATE,
			PERMISSIONS.RECORD_EDIT_ALL,
			PERMISSIONS.RECORD_CONTINUE,
			PERMISSIONS.RECORD_CANCEL,
			// Chat
			PERMISSIONS.CHAT_VIEW,
			PERMISSIONS.CHAT_SEND,
			PERMISSIONS.CHAT_SEND_OPERATIONAL,
			// Inventory
			PERMISSIONS.INVENTORY_VIEW,
			PERMISSIONS.INVENTORY_CREATE,
			PERMISSIONS.INVENTORY_EDIT,
			PERMISSIONS.INVENTORY_CONSUME,
			PERMISSIONS.INVENTORY_ADJUST,
			// Finance
			PERMISSIONS.FINANCE_VIEW,
			PERMISSIONS.FINANCE_PAYMENT_CREATE,
			PERMISSIONS.FINANCE_EXPENSE_CREATE,
			PERMISSIONS.FINANCE_DEBT_MANAGE,
			PERMISSIONS.FINANCE_REPORTS,
			// Reports
			PERMISSIONS.REPORTS_VIEW,
			PERMISSIONS.REPORTS_DAILY,
			PERMISSIONS.REPORTS_WEEKLY,
			PERMISSIONS.REPORTS_MONTHLY,
			// Audit
			PERMISSIONS.AUDIT_VIEW,
			// Staff
			PERMISSIONS.STAFF_VIEW_ACTIVITY
		]
	},
	
	// ═══════════════════════════════════════════════
	// Reception (Reporter)
	// ═══════════════════════════════════════════════
	{
		name: 'پذیرش',
		slug: 'reception',
		baseRole: 'reporter',
		description: 'پذیرش بیمار — ثبت اولیه',
		sortOrder: 10,
		permissions: [
			PERMISSIONS.ORG_VIEW,
			PERMISSIONS.RECORD_VIEW_OWN,
			PERMISSIONS.RECORD_CREATE,
			PERMISSIONS.RECORD_EDIT_OWN,
			PERMISSIONS.RECORD_CONTINUE,
			PERMISSIONS.CHAT_VIEW,
			PERMISSIONS.CHAT_SEND,
			PERMISSIONS.CHAT_SEND_OPERATIONAL,
			PERMISSIONS.INVENTORY_VIEW,
			PERMISSIONS.INVENTORY_CONSUME,
			PERMISSIONS.FINANCE_PAYMENT_CREATE
		]
	},
	
	// ═══════════════════════════════════════════════
	// Doctor (Operator)
	// ═══════════════════════════════════════════════
	{
		name: 'داکتر',
		slug: 'doctor',
		baseRole: 'operator',
		description: 'داکتر — معاینه و تشخیص',
		sortOrder: 20,
		permissions: [
			PERMISSIONS.ORG_VIEW,
			PERMISSIONS.RECORD_VIEW_ASSIGNED,
			PERMISSIONS.RECORD_VIEW_OWN,
			PERMISSIONS.RECORD_CREATE,
			PERMISSIONS.RECORD_EDIT_OWN,
			PERMISSIONS.RECORD_CONTINUE,
			PERMISSIONS.CHAT_VIEW,
			PERMISSIONS.CHAT_SEND,
			PERMISSIONS.CHAT_SEND_OPERATIONAL,
			PERMISSIONS.INVENTORY_VIEW,
			PERMISSIONS.FINANCE_PAYMENT_CREATE
		]
	},
	
	// ═══════════════════════════════════════════════
	// Pharmacy (Operator)
	// ═══════════════════════════════════════════════
	{
		name: 'دواخانه',
		slug: 'pharmacy',
		baseRole: 'operator',
		description: 'دواخانه — فروش دارو',
		sortOrder: 30,
		permissions: [
			PERMISSIONS.ORG_VIEW,
			PERMISSIONS.RECORD_VIEW_ASSIGNED,
			PERMISSIONS.RECORD_VIEW_OWN,
			PERMISSIONS.RECORD_CREATE,
			PERMISSIONS.RECORD_EDIT_OWN,
			PERMISSIONS.RECORD_CONTINUE,
			PERMISSIONS.CHAT_VIEW,
			PERMISSIONS.CHAT_SEND,
			PERMISSIONS.CHAT_SEND_OPERATIONAL,
			PERMISSIONS.INVENTORY_VIEW,
			PERMISSIONS.INVENTORY_CREATE,
			PERMISSIONS.INVENTORY_EDIT,
			PERMISSIONS.INVENTORY_CONSUME,
			PERMISSIONS.FINANCE_PAYMENT_CREATE
		]
	},
	
	// ═══════════════════════════════════════════════
	// Laboratory (Operator)
	// ═══════════════════════════════════════════════
	{
		name: 'آزمایشگاه',
		slug: 'laboratory',
		baseRole: 'operator',
		description: 'آزمایشگاه — انجام آزمایش',
		sortOrder: 40,
		permissions: [
			PERMISSIONS.ORG_VIEW,
			PERMISSIONS.RECORD_VIEW_ASSIGNED,
			PERMISSIONS.RECORD_VIEW_OWN,
			PERMISSIONS.RECORD_CREATE,
			PERMISSIONS.RECORD_EDIT_OWN,
			PERMISSIONS.RECORD_CONTINUE,
			PERMISSIONS.CHAT_VIEW,
			PERMISSIONS.CHAT_SEND,
			PERMISSIONS.CHAT_SEND_OPERATIONAL,
			PERMISSIONS.INVENTORY_VIEW,
			PERMISSIONS.INVENTORY_CONSUME,
			PERMISSIONS.FINANCE_PAYMENT_CREATE
		]
	},
	
	// ═══════════════════════════════════════════════
	// Midwife (Operator)
	// ═══════════════════════════════════════════════
	{
		name: 'قابله',
		slug: 'midwife',
		baseRole: 'operator',
		description: 'قابله — خدمات قابله‌گی',
		sortOrder: 50,
		permissions: [
			PERMISSIONS.ORG_VIEW,
			PERMISSIONS.RECORD_VIEW_ASSIGNED,
			PERMISSIONS.RECORD_VIEW_OWN,
			PERMISSIONS.RECORD_CREATE,
			PERMISSIONS.RECORD_EDIT_OWN,
			PERMISSIONS.RECORD_CONTINUE,
			PERMISSIONS.CHAT_VIEW,
			PERMISSIONS.CHAT_SEND,
			PERMISSIONS.CHAT_SEND_OPERATIONAL,
			PERMISSIONS.INVENTORY_VIEW,
			PERMISSIONS.INVENTORY_CONSUME,
			PERMISSIONS.FINANCE_PAYMENT_CREATE
		]
	},
	
	// ═══════════════════════════════════════════════
	// Dentist (Operator)
	// ═══════════════════════════════════════════════
	{
		name: 'دندانساز',
		slug: 'dentist',
		baseRole: 'operator',
		description: 'دندانساز — خدمات دندان',
		sortOrder: 60,
		permissions: [
			PERMISSIONS.ORG_VIEW,
			PERMISSIONS.RECORD_VIEW_ASSIGNED,
			PERMISSIONS.RECORD_VIEW_OWN,
			PERMISSIONS.RECORD_CREATE,
			PERMISSIONS.RECORD_EDIT_OWN,
			PERMISSIONS.RECORD_CONTINUE,
			PERMISSIONS.CHAT_VIEW,
			PERMISSIONS.CHAT_SEND,
			PERMISSIONS.CHAT_SEND_OPERATIONAL,
			PERMISSIONS.INVENTORY_VIEW,
			PERMISSIONS.INVENTORY_CONSUME,
			PERMISSIONS.FINANCE_PAYMENT_CREATE
		]
	}
];

export interface SeedCategory {
	name: string;
	slug: string;
	description?: string;
	icon?: string;
	color?: string;
	sortOrder: number;
	parentSlug?: string;
}

export const CLINIC_CATEGORIES: SeedCategory[] = [
	{
		name: 'پذیرش',
		slug: 'reception',
		description: 'بخش پذیرش بیمار',
		icon: 'user-plus',
		color: '#3b82f6',
		sortOrder: 1
	},
	{
		name: 'معاینه',
		slug: 'examination',
		description: 'اتاق معاینه داکتر',
		icon: 'stethoscope',
		color: '#10b981',
		sortOrder: 2
	},
	{
		name: 'دواخانه',
		slug: 'pharmacy',
		description: 'فروش دارو',
		icon: 'pill',
		color: '#f59e0b',
		sortOrder: 3
	},
	{
		name: 'آزمایشگاه',
		slug: 'laboratory',
		description: 'انجام آزمایش',
		icon: 'flask-conical',
		color: '#8b5cf6',
		sortOrder: 4
	},
	{
		name: 'قابله‌گی',
		slug: 'maternity',
		description: 'خدمات قابله‌گی',
		icon: 'baby',
		color: '#ec4899',
		sortOrder: 5
	},
	{
		name: 'دندان',
		slug: 'dental',
		description: 'خدمات دندانپزشکی',
		icon: 'tooth',
		color: '#06b6d4',
		sortOrder: 6
	}
];

export interface SeedWorkflowStep {
	stepOrder: number;
	categorySlug: string;
	roleSlug?: string;
	name: string;
	description?: string;
	isTerminal?: boolean;
	isOptional?: boolean;
}

export interface SeedWorkflow {
	name: string;
	slug: string;
	description?: string;
	steps: SeedWorkflowStep[];
}

export const CLINIC_WORKFLOWS: SeedWorkflow[] = [
	{
		name: 'مسیر عمومی بیمار',
		slug: 'general-patient-flow',
		description: 'مسیر استاندارد از پذیرش تا دواخانه',
		steps: [
			{
				stepOrder: 1,
				categorySlug: 'reception',
				roleSlug: 'reception',
				name: 'پذیرش',
				description: 'ثبت بیمار و پرداخت اولیه'
			},
			{
				stepOrder: 2,
				categorySlug: 'examination',
				roleSlug: 'doctor',
				name: 'معاینه',
				description: 'معاینه توسط داکتر'
			},
			{
				stepOrder: 3,
				categorySlug: 'pharmacy',
				roleSlug: 'pharmacy',
				name: 'دواخانه',
				description: 'تحویل دارو',
				isOptional: true
			},
			{
				stepOrder: 4,
				categorySlug: 'examination',
				roleSlug: 'doctor',
				name: 'تکمیل',
				description: 'بستن پرونده',
				isTerminal: true
			}
		]
	}
];