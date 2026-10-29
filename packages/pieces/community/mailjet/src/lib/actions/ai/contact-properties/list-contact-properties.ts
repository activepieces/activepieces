import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetContactPropertyOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListContactPropertiesAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_contact_properties',
	outputSchema: mailjetContactPropertyOutputSchema,
	displayName: 'List Contact Properties',
	description: 'Lists the contact property definitions of the account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists contact property definitions (name, data type, namespace) with their IDs. Use it to find property names for Update Contact Data.',
		idempotent: true,
	},
	props: {
		dataType: Property.StaticDropdown({
			displayName: 'Data Type',
			description: 'Value type: str, int, float, bool or datetime.',
			required: false,
			options: {
				options: ['str', 'int', 'float', 'bool', 'datetime'].map((value) => ({
					label: value,
					value,
				})),
			},
		}),
		namespace: Property.StaticDropdown({
			displayName: 'Namespace',
			description: 'static (one value per contact) or historic (keeps every value).',
			required: false,
			options: {
				options: [
					{ label: 'static', value: 'static' },
					{ label: 'historic', value: 'historic' },
				],
			},
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/contactmetadata',
			query: { DataType: p.dataType, Namespace: p.namespace, ...mailjetUtils.pagingQuery(p) },
		});
	},
});
