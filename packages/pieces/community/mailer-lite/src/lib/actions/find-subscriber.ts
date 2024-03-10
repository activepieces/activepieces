import MailerLite from '@mailerlite/mailerlite-nodejs';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../..';

export const findSubscriberAction = createAction({
	auth: mailerLiteAuth,
	name: 'find_subscriber',
	displayName: 'Find a Subscriber',
	description: 'Search for subscriber by email or name.',
	props: {
		searchValue: Property.ShortText({
			displayName: 'Subscriber ID or Email',
			required: true,
		}),
	},
	async run(context) {
		const client = new MailerLite({ api_key: context.auth });
		const response = await client.subscribers.find(context.propsValue.searchValue);
		return response.data;
	},
});
