import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
	listItems,
	getItem,
	createItem,
	updateItem,
	adjustStock,
	listTransactions,
	getLowStockItems,
	getExpiringSoonItems,
	getInventoryStats,
	InventoryError
} from '../services/inventory.js';

// ═══════════════════════════════════════════════
// Schemas
// ═══════════════════════════════════════════════

const ListQuerySchema = z.object({
	search: z.string().optional(),
	categoryId: z.string().optional(),
	lowStockOnly: z.coerce.boolean().optional(),
	limit: z.coerce.number().min(1).max(500).default(200)
});

const CreateItemSchema = z.object({
	name: z.string().min(1).max(200),
	categoryId: z.string().optional(),
	description: z.string().max(1000).optional(),
	unit: z.string().max(50).default('عدد'),
	quantity: z.number().min(0).default(0),
	minimumStock: z.number().min(0).default(0),
	purchasePrice: z.number().min(0).optional(),
	salePrice: z.number().min(0).optional(),
	batchNumber: z.string().max(100).optional(),
	expiryDate: z.string().datetime().optional(),
	supplier: z.string().max(200).optional()
});

const UpdateItemSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	categoryId: z.string().nullable().optional(),
	description: z.string().max(1000).nullable().optional(),
	unit: z.string().max(50).optional(),
	minimumStock: z.number().min(0).optional(),
	purchasePrice: z.number().min(0).nullable().optional(),
	salePrice: z.number().min(0).nullable().optional(),
	batchNumber: z.string().max(100).nullable().optional(),
	expiryDate: z.string().datetime().nullable().optional(),
	supplier: z.string().max(200).nullable().optional(),
	isActive: z.boolean().optional()
});

const AdjustStockSchema = z.object({
	itemId: z.string(),
	type: z.enum(['purchase', 'sale', 'consume', 'adjust', 'return']),
	quantity: z.number(),
	unitPrice: z.number().min(0).optional(),
	notes: z.string().max(500).optional()
});

// ═══════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════

const inventoryRoutes: FastifyPluginAsync = async (app) => {
	app.addHook('preHandler', app.authenticate);

	// GET /api/inventory/items
	app.get('/inventory/items', async (request, reply) => {
		const query = ListQuerySchema.safeParse(request.query);
		if (!query.success) {
			return reply.status(400).send({ error: 'ValidationError' });
		}

		const items = await listItems({
			organizationId: (request.user as { orgId: string }).orgId,
			...query.data
		});

		return { items };
	});

	// GET /api/inventory/items/:id
	app.get<{ Params: { id: string } }>('/inventory/items/:id', async (request, reply) => {
		const item = await getItem(request.params.id, (request.user as { orgId: string }).orgId);
		if (!item) {
			return reply.status(404).send({ error: 'NOT_FOUND' });
		}
		return item;
	});

	// POST /api/inventory/items
	app.post('/inventory/items', {
		preHandler: async (request, reply) => {
			if ((request.user as { baseRole: string }).baseRole !== 'manager') {
				return reply.status(403).send({
					error: 'FORBIDDEN',
					message: 'فقط مدیر می‌تواند آیتم اضافه کند'
				});
			}
		}
		}, async (request, reply) => {
	const body = CreateItemSchema.safeParse(request.body);
		if (!body.success) {
			return reply.status(400).send({
				error: 'ValidationError',
				details: body.error.flatten().fieldErrors
			});
		}

		try {
			const id = await createItem({
				organizationId: (request.user as { orgId: string }).orgId,
				userId: (request.user as { sub: string }).sub,
				...body.data,
				expiryDate: body.data.expiryDate ? new Date(body.data.expiryDate) : undefined
			});

			return reply.status(201).send({ id });
		} catch (error) {
			if (error instanceof InventoryError) {
				return reply.status(error.statusCode).send({
					error: error.code,
					message: error.message
				});
			}
			throw error;
		}	});

	// PATCH /api/inventory/items/:id — فقط Manager
	app.patch<{ Params: { id: string } }>('/inventory/items/:id', {
		preHandler: async (request, reply) => {
			if ((request.user as { baseRole: string }).baseRole !== 'manager') {
				return reply.status(403).send({
					error: 'FORBIDDEN',
					message: 'فقط مدیر می‌تواند آیتم را ویرایش کند'
				});
			}
		}
	}, async (request, reply) => {
		const body = UpdateItemSchema.safeParse(request.body);
		if (!body.success) {
			return reply.status(400).send({ error: 'ValidationError' });
		}

		try {
			await updateItem(request.params.id, (request.user as { orgId: string }).orgId, {
				...body.data,
				expiryDate: body.data.expiryDate !== undefined
					? body.data.expiryDate ? new Date(body.data.expiryDate) : null
					: undefined
			});
			return { success: true };
		} catch (error) {
			if (error instanceof InventoryError) {
				return reply.status(error.statusCode).send({
					error: error.code,
					message: error.message
				});
			}
			throw error;
		}
	});

	

	// POST /api/inventory/adjust
	app.post('/inventory/adjust', {
		preHandler: async (request, reply) => {
			if ((request.user as { baseRole: string }).baseRole !== 'manager') {
				return reply.status(403).send({
					error: 'FORBIDDEN',
					message: 'فقط مدیر می‌تواند موجودی را تنظیم کند'
				});
			}
		}
	}, async (request, reply) => {
		const body = AdjustStockSchema.safeParse(request.body);
		if (!body.success) {
			return reply.status(400).send({ error: 'ValidationError' });
		}

		try {
			await adjustStock({
				organizationId: (request.user as { orgId: string }).orgId,
				userId: (request.user as { sub: string }).sub,
				...body.data
			});
			return { success: true };
		} catch (error) {
			if (error instanceof InventoryError) {
				return reply.status(error.statusCode).send({
					error: error.code,
					message: error.message
				});
			}
			throw error;
		}
	});

	// GET /api/inventory/transactions
	app.get('/inventory/transactions', async (request, reply) => {
		const query = z.object({
			itemId: z.string().optional(),
			type: z.string().optional(),
			limit: z.coerce.number().min(1).max(500).default(100)
		}).safeParse(request.query);

		if (!query.success) {
			return reply.status(400).send({ error: 'ValidationError' });
		}

		const transactions = await listTransactions({
			organizationId: (request.user as { orgId: string }).orgId,
			...query.data
		});

		return { transactions };
	});

	// GET /api/inventory/alerts/low-stock
	app.get('/inventory/alerts/low-stock', async (request) => {
		const items = await getLowStockItems((request.user as { orgId: string }).orgId);
		return { items };
	});

	// GET /api/inventory/alerts/expiring
	app.get('/inventory/alerts/expiring', async (request) => {
		const items = await getExpiringSoonItems((request.user as { orgId: string }).orgId);
		return { items };
	});

	// GET /api/inventory/stats
	app.get('/inventory/stats', async (request) => {
		return getInventoryStats((request.user as { orgId: string }).orgId);
	});
};

export default inventoryRoutes;