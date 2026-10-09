import { createAction } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetDeletedOutputSchema } from '../../../output-schemas';

export const mailjetDeleteContactDataAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_delete_contact_data',
	outputSchema: mailjetDeletedOutputSchema,
	displayName: 'Delete Contact Data',
	description: 'Deletes the contact property values of one contact.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes the property values stored for one contact. The contact itself stays; to erase it use Delete Contact.',
		idempotent: false,
	},
	props: {
		contactId: mailjetAiProps.id({
			displayName: 'Contact ID',
			description: 'Numeric contact ID, from List Contacts or Get Contact.',
		}),
	},
	async run(context) {
		return await mailjetApi.remove({
			auth: context.auth,
			path: `/v3/REST/contactdata/${encodeURIComponent(context.propsValue.contactId)}`,
		});
	},
});
