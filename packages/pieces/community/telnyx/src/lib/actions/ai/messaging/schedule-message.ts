import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxScheduleMessageAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_schedule_message',
	displayName: 'Schedule Message',
	description: 'Schedules an SMS or MMS message to be sent later.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Schedules an SMS or MMS for a future time (5 minutes to 5 days ahead). Returns the message with its id; pass that id to Cancel Scheduled Message to cancel it before it is sent. Same sender rules as Send Message. Not idempotent: every call schedules a new message.',
		idempotent: false,
	},
	props: {
		to: Property.ShortText({
			displayName: 'To',
			description: 'Destination phone number in E.164 format, e.g. "+13125550002".',
			required: true,
		}),
		sendAt: Property.DateTime({
			displayName: 'Send At',
			description: 'ISO 8601 time to send the message, 5 minutes to 5 days from now.',
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
		webhookUrl: Property.ShortText({
			displayName: 'Webhook URL',
			description: 'Optional URL for delivery status webhooks of this message.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.scheduleMessage({
			auth: context.auth,
			body: telnyxUtils.compact({
				values: {
					to: p.to,
					send_at: p.sendAt,
					from: p.from,
					messaging_profile_id: p.messagingProfileId,
					text: p.text,
					subject: p.subject,
					media_urls: p.mediaUrls,
					webhook_url: p.webhookUrl,
				},
			}),
		});
	},
});
