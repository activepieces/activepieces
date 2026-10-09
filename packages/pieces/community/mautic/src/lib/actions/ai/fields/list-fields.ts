import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticListFieldsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListFieldsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_fields',
	outputSchema: mauticListFieldsOutputSchema,
	displayName: 'List Fields',
	description: 'Lists Mautic fields.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the custom and core fields of contacts or companies with alias, type and options. The aliases are the keys for contact and company field values. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		object: Property.StaticDropdown({
			displayName: 'Object',
			required: true,
			options: {
				options: [
					{ label: 'Contact', value: 'contact' },
					{ label: 'Company', value: 'company' },
				],
			},
		}),
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: `fields/${context.propsValue.object}`,
			key: 'fields',
			query: context.propsValue,
		});
	},
});
