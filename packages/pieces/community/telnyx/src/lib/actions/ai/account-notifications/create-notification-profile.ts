import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxCreateNotificationProfileAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_create_notification_profile',
	displayName: 'Create Notification Profile',
	description: 'Creates a notification profile.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a named notification profile. Then add destinations with Create Notification Channel and events with Create Notification Setting. Not idempotent: every call creates a profile.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Name of the notification profile.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.createNotificationProfile({
			auth: context.auth,
			body: { name: context.propsValue.name },
		});
	},
});
