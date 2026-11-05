import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxDeleteNotificationSettingAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_delete_notification_setting',
	displayName: 'Delete Notification Setting',
	description: 'Deletes a notification setting.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes a notification setting so its channel stops receiving that event. Returns the setting; deletion can be asynchronous, shown by its status.',
		idempotent: false,
	},
	props: {
		settingId: Property.ShortText({
			displayName: 'Notification Setting ID',
			description: 'Notification setting UUID. Use List Notification Settings to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.deleteNotificationSetting({
			auth: context.auth,
			settingId: context.propsValue.settingId,
		});
	},
});
