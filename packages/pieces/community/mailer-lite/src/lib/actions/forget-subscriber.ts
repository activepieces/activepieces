import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { forgetSubscriberOutputSchema } from '../output-schemas';

export const forgetSubscriberAction = createAction({
	auth: mailerLiteAuth,
	name: 'forget_subscriber',
	classification: 'DESTRUCTIVE',
	displayName: 'Forget Subscriber (GDPR)',
	description: 'Remove a subscriber and permanently erase their data (GDPR).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Remove a MailerLite subscriber and permanently erase all of their data within 30 days (GDPR right to be forgotten). This cannot be undone. Lighter options: delete_subscriber removes the subscriber but keeps their data in case they re-subscribe, and unsubscribe_subscriber only opts them out. Get the ID from find_subscriber. Returns the subscriber with forget_at set. Not idempotent: a repeat call on a forgotten subscriber returns an error.',
		idempotent: false,
	},
	outputSchema: forgetSubscriberOutputSchema,
	props: {
		subscriber_id: Property.ShortText({
			displayName: 'Subscriber ID',
			description: 'The subscriber ID, from find_subscriber or list_subscribers.',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.subscriber_id, label: 'Subscriber ID' });
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			path: `/subscribers/${id}/forget`,
			resource: `subscriber ${id}`,
		});
		return mailerLiteApi.unwrapData(body);
	},
});
