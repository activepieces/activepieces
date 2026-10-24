import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskListFieldsOutputSchema } from '../../../output-schemas';

export const zohoDeskListFieldsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_fields',
	outputSchema: zohoDeskListFieldsOutputSchema,
	displayName: 'List Fields',
	description: 'Lists the fields of a module, including custom fields and allowed values.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the fields of one module with their API names, types and allowed values, including custom fields (`cf_*`) and ticket statuses. Use it to learn the names and values that create, update and update-many actions accept.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		module: Property.StaticDropdown({
			displayName: 'Module',
			description: 'Module whose fields to list.',
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
					{ label: 'contracts', value: 'contracts' },
					{ label: 'products', value: 'products' },
				],
			},
		}),
		departmentId: zohoDeskAiProps.departmentId({
			required: false,
			description: 'Only fields used in this department.',
		}),
		apiNames: Property.Array({
			displayName: 'API Names',
			description: 'Only these fields, by API name.',
			required: false,
		}),
	},
	async run(context) {
		const { orgId, module, departmentId, apiNames } = context.propsValue;
		const fields = await zohoDeskApi.listFields({
			auth: context.auth,
			orgId,
			module,
			departmentId,
			apiNames: zohoDeskUtils.optionalStringList({ value: apiNames, propName: 'API Names' }),
		});
		return { fields, count: fields.length };
	},
});
