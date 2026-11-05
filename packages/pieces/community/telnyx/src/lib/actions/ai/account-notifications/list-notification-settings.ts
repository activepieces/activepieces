import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListNotificationSettingsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_notification_settings',
	displayName: 'List Notification Settings',
	description: 'Lists which events notify which channels.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of notification settings, each linking an event condition to a profile and channel. Filter by notification profile.',
		idempotent: true,
	},
	props: {
		notificationProfileId: Property.ShortText({
			displayName: 'Notification Profile ID',
			description: 'Notification profile UUID. Use List Notification Profiles to find it.',
			required: false,
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listNotificationSettings({
			auth: context.auth,
			query: {
				...telnyxUtils.toQuery({
					values: { 'filter[notification_profile_id][eq]': p.notificationProfileId },
				}),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
