import MailerLite from '@mailerlite/mailerlite-nodejs';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { unsubscribeSubscriberOutputSchema } from '../output-schemas';

export const unsubscribeSubscriberAction = createAction({
	auth: mailerLiteAuth,
	name: 'unsubscribe_subscriber',
	classification: 'WRITE',
	displayName: 'Unsubscribe Subscriber',
	description: 'Set a subscriber status to unsubscribed.',
	audience: 'both',
	aiMetadata: {
		description:
			'Mark a MailerLite subscriber as unsubscribed by email address, so they stop receiving campaigns while their record and history are retained. Use this for opt-out handling; use Delete Subscriber only when the record itself must go. Idempotent: unsubscribing an already-unsubscribed contact leaves them unchanged.',
		idempotent: true,
	},
	outputSchema: unsubscribeSubscriberOutputSchema,
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Email address of the subscriber to unsubscribe',
			required: true,
		}),
	},
	async run(context) {
		const client = new MailerLite({ api_key: context.auth.secret_text });
		const response = await client.subscribers.createOrUpdate({
			email: context.propsValue.email,
			status: 'unsubscribed',
		});
		return response.data;
	},
});
