import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetContactDataOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateContactDataAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_contact_data',
	outputSchema: mailjetContactDataOutputSchema,
	displayName: 'Update Contact Data',
	description: 'Sets contact property values on one contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets values for the given contact properties; properties not listed keep their value. Each property must exist first (see List Contact Properties / Create Contact Property).',
		idempotent: true,
	},
	props: {
		contactId: mailjetAiProps.id({
			displayName: 'Contact ID or Email',
			description: 'Numeric contact ID (from List Contacts) or the contact email.',
		}),
		data: Property.Json({
			displayName: 'Data',
			description: 'JSON array of property values, e.g. [{"Name":"city","Value":"Paris"}].',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.put({
			auth: context.auth,
			path: `/v3/REST/contactdata/${encodeURIComponent(p.contactId)}`,
			body: { Data: p.data },
		});
	},
});
