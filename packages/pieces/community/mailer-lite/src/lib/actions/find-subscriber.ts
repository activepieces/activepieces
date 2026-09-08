import MailerLite from '@mailerlite/mailerlite-nodejs';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { findSubscriberOutputSchema } from '../output-schemas';

export const findSubscriberAction = createAction({
	auth: mailerLiteAuth,
	name: 'find_subscriber',
	classification: 'READ',
	displayName: 'Find a Subscriber',
	description: 'Search for subscriber by email or name.',
	audience: 'both',
	aiMetadata: {
		description:
			'Look up a single MailerLite subscriber by their email address or subscriber ID. Use this to resolve a contact to their record (status, fields, groups) before updating or segmenting them. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: findSubscriberOutputSchema,
	props: {
		searchValue: Property.ShortText({
			displayName: 'Subscriber ID or Email',
			required: true,
		}),
	},
	async run(context) {
		const client = new MailerLite({ api_key: context.auth.secret_text });
		const response = await client.subscribers.find(context.propsValue.searchValue);
		return response.data;
	},
});
