export const PERMISSIONS = {
	// Organization
	ORG_VIEW: 'org.view',
	ORG_EDIT: 'org.edit',
	ORG_MANAGE_MEMBERS: 'org.manage_members',
	ORG_MANAGE_ROLES: 'org.manage_roles',
	ORG_MANAGE_CATEGORIES: 'org.manage_categories',
	ORG_MANAGE_TEMPLATES: 'org.manage_templates',
	ORG_MANAGE_WORKFLOWS: 'org.manage_workflows',
	
	// Records
	RECORD_VIEW_ALL: 'record.view_all',
	RECORD_VIEW_OWN: 'record.view_own',
	RECORD_VIEW_ASSIGNED: 'record.view_assigned',
	RECORD_CREATE: 'record.create',
	RECORD_EDIT_OWN: 'record.edit_own',
	RECORD_EDIT_ALL: 'record.edit_all',
	RECORD_CONTINUE: 'record.continue',
	RECORD_CANCEL: 'record.cancel',
	
	// Chat
	CHAT_VIEW: 'chat.view',
	CHAT_SEND: 'chat.send',
	CHAT_SEND_OPERATIONAL: 'chat.send_operational',
	
	// Inventory
	INVENTORY_VIEW: 'inventory.view',
	INVENTORY_CREATE: 'inventory.create',
	INVENTORY_EDIT: 'inventory.edit',
	INVENTORY_CONSUME: 'inventory.consume',
	INVENTORY_ADJUST: 'inventory.adjust',
	
	// Finance
	FINANCE_VIEW: 'finance.view',
	FINANCE_PAYMENT_CREATE: 'finance.payment_create',
	FINANCE_EXPENSE_CREATE: 'finance.expense_create',
	FINANCE_DEBT_MANAGE: 'finance.debt_manage',
	FINANCE_REPORTS: 'finance.reports',
	
	// Reports
	REPORTS_VIEW: 'reports.view',
	REPORTS_DAILY: 'reports.daily',
	REPORTS_WEEKLY: 'reports.weekly',
	REPORTS_MONTHLY: 'reports.monthly',
	
	// Audit
	AUDIT_VIEW: 'audit.view',
	
	// Staff
	STAFF_VIEW_ACTIVITY: 'staff.view_activity'
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];