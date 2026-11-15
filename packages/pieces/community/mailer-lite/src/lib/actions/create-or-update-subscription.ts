import MailerLite from '@mailerlite/mailerlite-nodejs';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { addOrUpdateSubscriberOutputSchema } from '../output-schemas';
import { mailerLiteCommon } from '../common';
import dayjs from 'dayjs';

export const createOrUpdateSubscriber = createAction({
	auth: mailerLiteAuth,
	name: 'add_or_update_subscriber',
	classification: 'WRITE',
	displayName: 'Add or Update Subscriber',
	description: 'Add a subscriber, or update the one with this email.',
	audience: 'both',
	aiMetadata: {
		description:
			'Upsert a MailerLite subscriber by email: creates the contact if the email is new, otherwise updates the existing record (status, custom fields, group membership, opt-in metadata). Use this to add or sync a contact when you only have their email. Idempotent — keyed on email, so repeating with the same input converges on the same subscriber state.',
		idempotent: true,
	},
	outputSchema: addOrUpdateSubscriberOutputSchema,
	propertyGroups: [
		{
			key: 'subscriber',
			display: 'section',
			label: 'Subscriber',
			icon: 'user',
			props: ['update_info', 'email', 'status'],
		},
		{
			key: 'profile',
			display: 'section',
			label: 'Fields and Groups',
			icon: 'tag',
			props: ['subscriberFields', 'subscriberGroupId'],
		},
		{
			key: 'consent',
			display: 'section',
			label: 'Consent',
			icon: 'calendar',
			props: ['subscribed_at', 'opted_in_at', 'ip_address', 'optin_ip'],
		},
	],
	props: {
		update_info: Property.MarkDown({
			value: 'If this email is already on your list, that subscriber is updated.',
			variant: MarkdownVariant.INFO,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			placeholder: 'jane@example.com',
			required: true,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			description: 'Applied to new and existing subscribers.',
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
		subscriberFields: mailerLiteCommon.subscriberFields,
		subscriberGroupId: mailerLiteCommon.subscriberGroupIds(false),
		subscribed_at: Property.DateTime({
			displayName: 'Subscribed On',
			required: false,
			width: 'half',
		}),
		opted_in_at: Property.DateTime({
			displayName: 'Opted In On',
			required: false,
			width: 'half',
		}),
		ip_address: Property.ShortText({
			displayName: 'Signup IP Address',
			placeholder: '203.0.113.7',
			required: false,
			width: 'half',
		}),
		optin_ip: Property.ShortText({
			displayName: 'Opt-in IP Address',
			placeholder: '203.0.113.7',
			required: false,
			width: 'half',
		}),
	},
	async run(context) {
		const client = new MailerLite({ api_key: context.auth.secret_text });
		const response = await client.subscribers.createOrUpdate({
			email: context.propsValue.email,
			fields: context.propsValue.subscriberFields,
			groups: context.propsValue.subscriberGroupId,
			status: context.propsValue.status as status,
			subscribed_at: context.propsValue.subscribed_at
				? dayjs(context.propsValue.subscribed_at).format('YYYY-MM-DD HH:mm:ss')
				: undefined,
			opted_in_at: context.propsValue.opted_in_at
				? dayjs(context.propsValue.opted_in_at).format('YYYY-MM-DD HH:mm:ss')
				: undefined,
			ip_address: context.propsValue.ip_address,
			optin_ip: context.propsValue.optin_ip,
		});
		return response.data;
	},
});

type status = 'active' | 'unsubscribed' | 'unconfirmed' | 'bounced' | 'junk';
