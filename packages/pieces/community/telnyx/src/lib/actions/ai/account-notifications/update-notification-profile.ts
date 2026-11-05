import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxUpdateNotificationProfileAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_notification_profile',
	displayName: 'Update Notification Profile',
	description: 'Renames a notification profile.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Renames a notification profile, the only field the API lets you change. Use the id from List Notification Profiles or Create Notification Profile. Repeating the call with the same name leaves it unchanged.',
		idempotent: true,
	},
	props: {
		notificationProfileId: Property.ShortText({
			displayName: 'Notification Profile ID',
			description: 'Notification profile UUID. Use List Notification Profiles to find it.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New name of the notification profile.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.updateNotificationProfile({
			auth: context.auth,
			profileId: p.notificationProfileId,
			body: { name: p.name },
		});
	},
});
