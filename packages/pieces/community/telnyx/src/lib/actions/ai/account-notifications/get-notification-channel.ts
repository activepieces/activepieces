import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetNotificationChannelAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_notification_channel',
	displayName: 'Get Notification Channel',
	description: 'Gets a notification channel.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one notification channel by id: its profile, channel type and destination.',
		idempotent: true,
	},
	props: {
		channelId: Property.ShortText({
			displayName: 'Notification Channel ID',
			description: 'Notification channel UUID. Use List Notification Channels to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getNotificationChannel({
			auth: context.auth,
			channelId: context.propsValue.channelId,
		});
	},
});
