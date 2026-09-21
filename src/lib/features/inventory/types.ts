export interface InventoryItem {
	id: string;
	organizationId: string;
	categoryId: string | null;
	categoryName: string | null;
	name: string;
	slug: string;
	description: string | null;
	unit: string;
	quantity: number;
	minimumStock: number;
	purchasePrice: number | null;
	salePrice: number | null;
	batchNumber: string | null;
	expiryDate: string | null;
	supplier: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface InventoryTransaction {
	id: string;
	itemId: string;
	itemName: string;
	type: string;
	quantity: number;
	unitPrice: number | null;
	totalPrice: number | null;
	recordId: string | null;
	notes: string | null;
	userId: string;
	userName: string;
	createdAt: string;
}

export interface InventoryStats {
	totalItems: number;
	lowStock: number;
	outOfStock: number;
	totalValue: number;
}