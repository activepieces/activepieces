import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListViewsOutputSchema } from '../../../output-schemas';

export const zohoDeskListViewsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_views',
	outputSchema: zohoDeskListViewsOutputSchema,
	displayName: 'List Views',
	description: 'Lists the saved views of a module.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the predefined and custom views for one module; view `id` values feed View ID inputs on List Tickets, List Contacts and the other list and count actions.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		module: Property.StaticDropdown({
			displayName: 'Module',
			description: 'Module whose views to list.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'tickets', value: 'tickets' },
					{ label: 'contacts', value: 'contacts' },
					{ label: 'accounts', value: 'accounts' },
					{ label: 'tasks', value: 'tasks' },
					{ label: 'calls', value: 'calls' },
					{ label: 'events', value: 'events' },
					{ label: 'activities', value: 'activities' },
					{ label: 'contracts', value: 'contracts' },
					{ label: 'products', value: 'products' },
				],
			},
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
	},
	async run(context) {
		const { orgId, module, departmentId } = context.propsValue;
		const views = await zohoDeskApi.listViews({ auth: context.auth, orgId, module, departmentId });
		return { views, count: views.length };
	},
});
