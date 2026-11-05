import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetNotificationProfileAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_notification_profile',
	displayName: 'Get Notification Profile',
	description: 'Gets a notification profile.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one notification profile by id.',
		idempotent: true,
	},
	props: {
		notificationProfileId: Property.ShortText({
			displayName: 'Notification Profile ID',
			description: 'Notification profile UUID. Use List Notification Profiles to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getNotificationProfile({
			auth: context.auth,
			profileId: context.propsValue.notificationProfileId,
		});
	},
});
