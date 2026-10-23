import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxDeleteNotificationProfileAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_delete_notification_profile',
	displayName: 'Delete Notification Profile',
	description: 'Deletes a notification profile.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a notification profile. Returns the deleted profile.',
		idempotent: false,
	},
	props: {
		notificationProfileId: Property.ShortText({
			displayName: 'Notification Profile ID',
			description: 'Notification profile UUID. Use List Notification Profiles to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.deleteNotificationProfile({
			auth: context.auth,
			profileId: context.propsValue.notificationProfileId,
		});
	},
});
