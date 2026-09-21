import type { FastifyPluginAsync } from 'fastify';
import {
	listTemplates,
	getAvailableTemplatesForRecord
} from '../services/templates.js';

const templatesRoutes: FastifyPluginAsync = async (app) => {
	app.addHook('preHandler', app.authenticate);

	// GET /api/templates
	app.get('/templates', async (request) => {
		const user = request.user as unknown as {
			orgId: string;
			roleId: string;
			baseRole: string;
			sub: string;
		};
		const templates = await listTemplates({
			organizationId: user.orgId,
			roleId: user.roleId,
			baseRole: user.baseRole
		});

		return { templates };
	});

	// GET /api/templates/for-record/:recordId
	app.get<{ Params: { recordId: string } }>(
		'/templates/for-record/:recordId',
		async (request) => {
			const user = request.user as unknown as {
				orgId: string;
				roleId: string;
				baseRole: string;
				sub: string;
			};
			const templates = await getAvailableTemplatesForRecord({
				organizationId: user.orgId,
				recordId: request.params.recordId,
				userId: user.sub,
				roleId: user.roleId,
				baseRole: user.baseRole
			});

			return { templates };
		}
	);
};

export default templatesRoutes;