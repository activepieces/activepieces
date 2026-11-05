import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxSendGroupMmsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_send_group_mms',
	displayName: 'Send Group MMS',
	description: 'Sends one MMS to a group of recipients in a shared thread.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends a group MMS from an MMS-capable US/CA Telnyx long code to up to 8 recipients, who all see each other in one thread. Returns the group message; use Get Group MMS with its id for per-recipient messages. Not idempotent: every call sends a new message.',
		idempotent: false,
	},
	props: {
		from: Property.ShortText({
			displayName: 'From',
			description: 'MMS-capable Telnyx long code in E.164 format.',
			required: true,
		}),
		to: Property.Array({
			displayName: 'To',
			description: 'Recipient phone numbers in E.164 format (up to 8).',
			required: true,
		}),
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
			description: 'Public URLs of media to attach.',
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
		return await telnyxApi.sendGroupMms({
			auth: context.auth,
			body: telnyxUtils.compact({
				values: {
					from: p.from,
					to: p.to,
					text: p.text,
					subject: p.subject,
					media_urls: p.mediaUrls,
					webhook_url: p.webhookUrl,
				},
			}),
		});
	},
});
