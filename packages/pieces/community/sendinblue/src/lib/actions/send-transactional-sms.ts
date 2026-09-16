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
	props: {
		sender: Property.ShortText({
			displayName: 'Sender',
			description:
				'Name or number shown as the sender. Limited to 11 alphanumeric characters or 15 numeric characters.',
			required: true,
		}),
		recipient: Property.ShortText({
			displayName: 'Recipient',
			description:
				'Mobile number with the country code and no leading plus or zeros, for example 33680005003.',
			required: true,
		}),
		content: Property.LongText({
			displayName: 'Content',
			description:
				'Message body. Longer than 160 characters is sent as multiple messages.',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
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
		}),
		web_url: Property.ShortText({
			displayName: 'Webhook URL',
			description: 'URL Brevo posts delivery reports for this message to.',
			required: false,
		}),
		unicode_enabled: Property.Checkbox({
			displayName: 'Unicode Enabled',
			description:
				'Send the content as unicode. Unicode messages are limited to 70 characters per part.',
			required: false,
		}),
		organisation_prefix: Property.ShortText({
			displayName: 'Organisation Prefix',
			description: 'Brand name prepended to the message content.',
			required: false,
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
