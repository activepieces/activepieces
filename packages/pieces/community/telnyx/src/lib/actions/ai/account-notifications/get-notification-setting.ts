import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetNotificationSettingAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_notification_setting',
	displayName: 'Get Notification Setting',
	description: 'Gets a notification setting.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one notification setting by id, including its status and parameters.',
		idempotent: true,
	},
	props: {
		settingId: Property.ShortText({
			displayName: 'Notification Setting ID',
			description: 'Notification setting UUID. Use List Notification Settings to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getNotificationSetting({
			auth: context.auth,
			settingId: context.propsValue.settingId,
		});
	},
});
