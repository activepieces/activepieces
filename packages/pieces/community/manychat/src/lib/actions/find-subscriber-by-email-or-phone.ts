import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { manychatAuth } from '../auth';
import { manychatClient, manychatUtils } from '../common/client';
import { manychatInput } from '../common/props';
import { manychatOutputSchemas } from '../common/output-schemas';

export const findSubscriberByEmailOrPhoneAction = createAction({
	auth: manychatAuth,
	name: 'find_subscriber_by_email_or_phone',
	classification: 'READ',
	displayName: 'Find Subscriber by Email or Phone',
	description: 'Finds the subscriber with a given email address (case-insensitive) or exact phone number.',
	audience: 'both',
	aiMetadata: {
		description:
			'Finds the one ManyChat subscriber whose email (case-insensitive) or phone (exact) matches; give exactly one of Email or Phone. Returns found false and an empty subscriber when nobody matches. Use before "Create Subscriber" to avoid duplicates, or to get a subscriber ID. Read-only.',
		idempotent: true,
	},
	outputSchema: manychatOutputSchemas.findBySystemField,
	props: {
		search_info: Property.MarkDown({
			value: 'Fill in Email or Phone Number, not both.',
			variant: MarkdownVariant.INFO,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Matched without regard to case.',
			placeholder: 'jane@example.com',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone Number',
			description: 'Exact match, in international format.',
			placeholder: '+14155550123',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const email = manychatInput.optionalText(propsValue.email);
		const phone = manychatInput.optionalText(propsValue.phone);
		if (email !== undefined && phone !== undefined) {
			throw new Error('Provide either Email or Phone Number, not both.');
		}
		if (email === undefined && phone === undefined) {
			throw new Error('Provide either Email or Phone Number.');
		}
		const body = await manychatClient.request({
			apiKey: manychatUtils.apiKeyOf(auth),
			method: 'GET',
			path: '/subscriber/findBySystemField',
			operation: 'find subscriber by email or phone',
			query: email !== undefined ? { email } : { phone },
		});
		const data = manychatUtils.dataOf(body);
		const subscriber = manychatUtils.isRecord(data) && data['id'] !== undefined && data['id'] !== null ? data : null;
		return { found: subscriber !== null, subscriber };
	},
});
