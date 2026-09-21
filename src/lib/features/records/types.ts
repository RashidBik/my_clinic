export interface RecordListItem {
	id: string;
	referenceCode: string;
	status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
	createdAt: string;
	createdBy: { id: string; name: string };
	assignedToRole: { id: string; name: string; slug: string } | null;
}

export interface RecordPayment {
	id: string;
	amount: number;
	currency: string;
	paymentMethod: string;
	description: string | null;
	createdAt: string;
	createdBy: string;
}

export interface RecordInventoryTx {
	id: string;
	itemName: string;
	type: string;
	quantity: number;
	createdAt: string;
}

export interface RecordStep {
	id: string;
	categoryId: string;
	categoryName: string;
	categorySlug: string;
	status: string;
	data: Record<string, unknown>;
	startedAt: string;
	completedAt: string | null;
	completedBy: string | null;
}

export interface RecordDetail {
	id: string;
	referenceCode: string;
	status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
	createdAt: string;
	updatedAt: string;
	completedAt: string | null;
	metadata: Record<string, unknown>;
	createdBy: { id: string; name: string };
	assignedToRole: { id: string; name: string; slug: string } | null;
	steps: RecordStep[];
	payments: RecordPayment[];
	inventoryTransactions: RecordInventoryTx[];
}