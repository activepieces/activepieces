import MailerLite from '@mailerlite/mailerlite-nodejs';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../..';
import { mailerLiteCommon } from '../common';

export const createOrUpdateSubscriber = createAction({
	auth: mailerLiteAuth,
	name: 'add_or_update_subscriber',
	displayName: 'Add or Update subscriber',
	description: 'Create or update a existing subscription',
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Email of the new contact',
			required: true,
		}),
		subscriberFields: mailerLiteCommon.subscriberFields,
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			description: 'If empty, status Active is used by default.',
			defaultValue: 'active',
			options: {
				disabled: false,
				options: [
					{
						label: 'Active',
						value: 'active',
					},
					{
						label: 'Unsubscribed',
						value: 'unsubscribed',
					},
					{
						label: 'Unconfirmed',
						value: 'unconfirmed',
					},
					{
						label: 'Bounced',
						value: 'bounced',
					},
					{
						label: 'Junk',
						value: 'junk',
					},
				],
			},
		}),
		subscriberGroupId: mailerLiteCommon.subscriberGroupIds(false),
		subscribed_at: Property.DateTime({
			displayName: 'Subscribed On',
			required: false,
			description: 'Provide YYYY-MM-DD HH:mm:ss format.',
		}),
		opted_in_at: Property.DateTime({
			displayName: 'Opt-in Date',
			required: false,
			description: 'Provide YYYY-MM-DD HH:mm:ss format.',
		}),
		ip_address: Property.ShortText({
			displayName: 'Signup IP address',
			required: false,
		}),
		optin_ip: Property.ShortText({
			displayName: 'Opt-in IP address',
			required: false,
		}),
	},
	async run(context) {
		const client = new MailerLite({ api_key: context.auth });
		const response = await client.subscribers.createOrUpdate({
			email: context.propsValue.email,
			fields: context.propsValue.subscriberFields,
			groups: context.propsValue.subscriberGroupId,
			status: context.propsValue.status as status,
			subscribed_at: context.propsValue.subscribed_at,
			opted_in_at: context.propsValue.opted_in_at,
			ip_address: context.propsValue.ip_address,
			optin_ip: context.propsValue.optin_ip,
		});

		return response.data;
	},
});

type status = 'active' | 'unsubscribed' | 'unconfirmed' | 'bounced' | 'junk';
