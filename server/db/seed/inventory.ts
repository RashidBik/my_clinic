import { db } from '../client.js';
import { inventoryItems } from '../schema/inventory.js';
import { createId } from '@paralleldrive/cuid2';

export const SAMPLE_INVENTORY = [
	{ name: 'پاراستامول', unit: 'قرص', quantity: 500, minimumStock: 50, purchasePrice: 2, salePrice: 5 },
	{ name: 'آموکسی‌سیلین', unit: 'کپسول', quantity: 200, minimumStock: 30, purchasePrice: 8, salePrice: 15 },
	{ name: 'ایبوپروفن', unit: 'قرص', quantity: 300, minimumStock: 40, purchasePrice: 3, salePrice: 8 },
	{ name: 'سرنج', unit: 'عدد', quantity: 100, minimumStock: 20, purchasePrice: 5, salePrice: 0 },
	{ name: 'دستکش', unit: 'جفت', quantity: 150, minimumStock: 30, purchasePrice: 10, salePrice: 0 },
	{ name: 'پنبه', unit: 'بسته', quantity: 80, minimumStock: 15, purchasePrice: 20, salePrice: 0 },
	{ name: 'گاز', unit: 'بسته', quantity: 60, minimumStock: 10, purchasePrice: 25, salePrice: 0 },
	{ name: 'بتادین', unit: 'بطری', quantity: 25, minimumStock: 5, purchasePrice: 80, salePrice: 0 },
	{ name: 'سرم شستشو', unit: 'بطری', quantity: 40, minimumStock: 10, purchasePrice: 30, salePrice: 0 },
	{ name: 'ماسک', unit: 'عدد', quantity: 200, minimumStock: 50, purchasePrice: 3, salePrice: 0 }
];

export async function seedInventory(organizationId: string) {
	const now = new Date();

	for (const item of SAMPLE_INVENTORY) {
		const id = createId();
		const slug = item.name.toLowerCase().replace(/\s+/g, '-');

		db.insert(inventoryItems)
			.values({
				id,
				organizationId,
				name: item.name,
				slug,
				unit: item.unit,
				quantity: item.quantity,
				minimumStock: item.minimumStock,
				purchasePrice: item.purchasePrice,
				salePrice: item.salePrice,
				isActive: true,
				createdAt: now,
				updatedAt: now
			})
			.run();
	}

	console.log(`📦 Created ${SAMPLE_INVENTORY.length} inventory items`);
}