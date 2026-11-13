import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetContactPropertyOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateContactPropertyAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_contact_property',
	outputSchema: mailjetContactPropertyOutputSchema,
	displayName: 'Update Contact Property',
	description: 'Renames a contact property or changes its data type.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates the name and/or data type of a contact property. Only the fields you set change.',
		idempotent: true,
	},
	props: {
		propertyId: mailjetAiProps.id({
			displayName: 'Property ID',
			description: 'Numeric property ID, from List Contact Properties.',
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New property name.',
			required: false,
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
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.put({
			auth: context.auth,
			path: `/v3/REST/contactmetadata/${encodeURIComponent(p.propertyId)}`,
			body: { Name: p.name, Datatype: p.dataType },
		});
	},
});
