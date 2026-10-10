import { createAction } from '@activepieces/pieces-framework';

import { mailjetContactOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetContactAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_contact',
	outputSchema: mailjetContactOutputSchema,
	displayName: 'Get Contact',
	description: 'Gets one Mailjet contact by ID or email.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets a contact by its numeric ID or by its email address. Returns a 404 error when no contact matches.',
		idempotent: true,
	},
	props: {
		contactId: mailjetAiProps.id({
			displayName: 'Contact ID or Email',
			description:
				'Numeric contact ID (from List Contacts or Create Contact) or the contact email.',
		}),
	},
	async run(context) {
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/contact/${encodeURIComponent(context.propsValue.contactId)}`,
		});
	},
});
