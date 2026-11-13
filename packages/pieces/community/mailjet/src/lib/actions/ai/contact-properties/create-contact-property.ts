import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetContactPropertyOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetApi } from '../../../common/api';

export const mailjetCreateContactPropertyAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_create_contact_property',
	outputSchema: mailjetContactPropertyOutputSchema,
	displayName: 'Create Contact Property',
	description: 'Creates a contact property definition.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a contact property that contacts can then hold values for (via Update Contact Data). The name must be unique within its namespace.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Property name, unique within the namespace.',
			required: true,
		}),
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
			description: 'static keeps one value per contact (default); historic keeps every value set.',
			required: false,
			options: {
				options: [
					{ label: 'static', value: 'static' },
					{ label: 'historic', value: 'historic' },
				],
			},
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: '/v3/REST/contactmetadata',
			body: { Name: p.name, Datatype: p.dataType, NameSpace: p.namespace },
		});
	},
});
