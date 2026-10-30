import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { sendTransactionalSmsActionOutputSchema } from '../output-schemas';

export const sendTransactionalSms = createAction({
	auth: sendinblueAuth,
	name: 'send_transactional_sms',
	outputSchema: sendTransactionalSmsActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Send Transactional SMS',
	description: 'Send a transactional SMS from your Brevo account.',
	audience: 'both',
	aiMetadata: {
		description:
			'Sends a one-off transactional SMS through Brevo to a single mobile number. The recipient must include the country code without a leading plus or zeros, and the sender is limited to 11 alphanumeric or 15 numeric characters. Content longer than 160 characters is split into multiple messages and billed accordingly. Not idempotent — each call sends a new message.',
		idempotent: false,
	},
	propertyGroups: [
		{ key: 'message', display: 'section', label: 'Message', icon: 'send', props: ['sender', 'recipient', 'content', 'type'] },
	],
	props: {
		sender: Property.ShortText({
			displayName: 'Sender',
			description: 'Up to 11 letters and digits, or 15 digits only.',
			placeholder: 'MyShop',
			required: true,
			width: 'half',
		}),
		recipient: Property.ShortText({
			displayName: 'Recipient',
			description: 'Country code first, no + or leading zeros.',
			placeholder: '33680005003',
			required: true,
			width: 'half',
		}),
		content: Property.LongText({
			displayName: 'Content',
			description: 'Over 160 characters is sent as several messages.',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Message Type',
			description: 'Transactional for order and account notices, Marketing for promotions.',
			required: false,
			defaultValue: 'transactional',
			options: {
				options: [
					{ label: 'Transactional', value: 'transactional' },
					{ label: 'Marketing', value: 'marketing' },
				],
			},
		}),
		tag: Property.ShortText({
			displayName: 'Tag',
			description: 'Label used to filter this message in Brevo reporting.',
			required: false,
			advanced: true,
		}),
		web_url: Property.ShortText({
			displayName: 'Webhook URL',
			description: 'Brevo posts delivery reports for this message here.',
			placeholder: 'https://example.com/sms-status',
			required: false,
			advanced: true,
		}),
		unicode_enabled: Property.Checkbox({
			displayName: 'Send as Unicode',
			description: 'Needed for emoji and non-Latin text; 70 characters per part.',
			required: false,
			advanced: true,
		}),
		organisation_prefix: Property.ShortText({
			displayName: 'Brand Name',
			description: 'Shown before the message so people know who sent it.',
			required: false,
			advanced: true,
		}),
	},
	async run(context) {
		const {
			sender,
			recipient,
			content,
			type,
			tag,
			web_url,
			unicode_enabled,
			organisation_prefix,
		} = context.propsValue;

		const body = {
			sender,
			recipient,
			content,
			type,
			tag,
			webUrl: web_url,
			unicodeEnabled: unicode_enabled,
			organisationPrefix: organisation_prefix,
		};

		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/transactionalSMS/send',
			body,
		});
	},
});
