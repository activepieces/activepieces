import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioUnsubscribeEmailsOutputSchema } from '../../output-schemas';

export const attioUnsubscribeEmailsAction = createAction({
	auth: attioAuth,
	name: 'attio_unsubscribe_emails',
	outputSchema: attioUnsubscribeEmailsOutputSchema,
	displayName: 'Unsubscribe Emails',
	description: 'Adds email addresses to the sequence unsubscribe list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Adds email addresses to the workspace sequence unsubscribe list, so they cannot be enrolled in sequences and active enrolments stop. The API cannot remove addresses again. Re-adding an address is harmless.',
		idempotent: true,
	},
	props: {
		email_addresses: Property.Array({ displayName: 'Email Addresses', required: true }),
	},
	async run(context) {
		const { email_addresses } = context.propsValue;
		const emails = attioAi.strings(email_addresses);
		if (emails.length === 0) {
			throw new Error('Provide at least one email address.');
		}
		const response = await attioApiCall<{ data: Record<string, unknown>[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/sequences/unsubscribed_emails',
			body: { data: { email_addresses: emails } },
		});
		return { unsubscribed: response.data, count: response.data.length };
	},
});
