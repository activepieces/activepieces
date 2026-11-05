import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxSendMessageAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_send_message',
	displayName: 'Send Message',
	description: 'Sends an SMS or MMS message right away.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Sends an SMS or MMS immediately. Set From to a Telnyx number, short code or alphanumeric sender (alphanumeric also needs Messaging Profile ID); leave From empty and set Messaging Profile ID to send from the profile's number pool. US long-code traffic needs a registered 10DLC campaign. To send later use Schedule Message. Not idempotent: every call sends a new message.",
		idempotent: false,
	},
	props: {
		to: Property.ShortText({
			displayName: 'To',
			description: 'Destination phone number in E.164 format, e.g. "+13125550002".',
			required: true,
		}),
		from: Property.ShortText({
			displayName: 'From',
			description:
				'Sending Telnyx number (E.164), short code or alphanumeric sender ID. Leave empty to use the number pool of the messaging profile.',
			required: false,
		}),
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: false }),
		text: Property.LongText({
			displayName: 'Text',
			description: 'Message body. Required unless Media URLs is set.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Optional MMS subject.',
			required: false,
		}),
		mediaUrls: Property.Array({
			displayName: 'Media URLs',
			description: 'Public URLs of media to attach; sends the message as MMS.',
			required: false,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'Force SMS or MMS. Defaults to SMS, or MMS when media is attached.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'SMS', value: 'SMS' },
					{ label: 'MMS', value: 'MMS' },
				],
			},
		}),
		webhookUrl: Property.ShortText({
			displayName: 'Webhook URL',
			description: 'Optional URL for delivery status webhooks of this message.',
			required: false,
		}),
		webhookFailoverUrl: Property.ShortText({
			displayName: 'Webhook Failover URL',
			description: 'Optional failover URL for delivery status webhooks.',
			required: false,
		}),
		useProfileWebhooks: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Use Profile Webhooks',
			description:
				"Whether to also send webhooks to the messaging profile's webhook URLs. Defaults to Yes.",
		}),
		autoDetect: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Auto Detect Long Messages',
			description: 'Whether to automatically detect and split long messages. Defaults to No.',
		}),
		encoding: Property.StaticDropdown({
			displayName: 'Encoding',
			description: 'Character encoding. Defaults to auto.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Auto', value: 'auto' },
					{ label: 'GSM-7', value: 'gsm7' },
					{ label: 'UCS-2', value: 'ucs2' },
				],
			},
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.createMessage({
			auth: context.auth,
			body: telnyxUtils.compact({
				values: {
					to: p.to,
					from: p.from,
					messaging_profile_id: p.messagingProfileId,
					text: p.text,
					subject: p.subject,
					media_urls: p.mediaUrls,
					type: p.type,
					webhook_url: p.webhookUrl,
					webhook_failover_url: p.webhookFailoverUrl,
					use_profile_webhooks: p.useProfileWebhooks,
					auto_detect: p.autoDetect,
					encoding: p.encoding,
				},
			}),
		});
	},
});
