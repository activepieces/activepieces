import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxDeleteNotificationChannelAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_delete_notification_channel',
	displayName: 'Delete Notification Channel',
	description: 'Deletes a notification channel.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a notification channel; notifications stop going to its destination. Returns the deleted channel.',
		idempotent: false,
	},
	props: {
		channelId: Property.ShortText({
			displayName: 'Notification Channel ID',
			description: 'Notification channel UUID. Use List Notification Channels to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.deleteNotificationChannel({
			auth: context.auth,
			channelId: context.propsValue.channelId,
		});
	},
});
