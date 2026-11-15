import { createAction } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetDeletedOutputSchema } from '../../../output-schemas';

export const mailjetDeleteContactAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_delete_contact',
	outputSchema: mailjetDeletedOutputSchema,
	displayName: 'Delete Contact',
	description: 'Permanently deletes a Mailjet contact and its data (GDPR delete).',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a contact with its properties, list subscriptions and tracking history (GDPR erasure). Cannot be undone. Takes the numeric contact ID; use Get Contact to find it from an email.',
		idempotent: false,
	},
	props: {
		contactId: mailjetAiProps.id({
			displayName: 'Contact ID',
			description: 'Numeric contact ID, from Get Contact or List Contacts.',
		}),
	},
	async run(context) {
		return await mailjetApi.remove({
			auth: context.auth,
			path: `/v4/contacts/${encodeURIComponent(context.propsValue.contactId)}`,
		});
	},
});
