import { createAction } from '@activepieces/pieces-framework';

import { mailjetContactDataOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetContactDataAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_contact_data',
	outputSchema: mailjetContactDataOutputSchema,
	displayName: 'Get Contact Data',
	description: 'Gets the contact property values of one contact.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets every contact property value set on one contact, as Name/Value pairs.',
		idempotent: true,
	},
	props: {
		contactId: mailjetAiProps.id({
			displayName: 'Contact ID or Email',
			description: 'Numeric contact ID (from List Contacts) or the contact email.',
		}),
	},
	async run(context) {
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/contactdata/${encodeURIComponent(context.propsValue.contactId)}`,
		});
	},
});
