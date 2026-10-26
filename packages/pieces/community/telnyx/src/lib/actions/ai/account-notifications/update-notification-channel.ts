import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxUpdateNotificationChannelAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_notification_channel',
	displayName: 'Update Notification Channel',
	description: 'Updates a notification channel.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a notification channel. Only the fields you set are changed; leave a field empty to keep it.',
		idempotent: true,
	},
	props: {
		channelId: Property.ShortText({
			displayName: 'Notification Channel ID',
			description: 'Notification channel UUID. Use List Notification Channels to find it.',
			required: true,
		}),
		notificationProfileId: Property.ShortText({
			displayName: 'Notification Profile ID',
			description: 'Notification profile UUID. Use List Notification Profiles to find it.',
			required: false,
		}),
		channelTypeId: Property.StaticDropdown({
			displayName: 'Channel Type',
			description: 'New channel type.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'SMS', value: 'sms' },
					{ label: 'Voice', value: 'voice' },
					{ label: 'Email', value: 'email' },
					{ label: 'Webhook', value: 'webhook' },
				],
			},
		}),
		channelDestination: Property.ShortText({
			displayName: 'Destination',
			description: 'New phone number (E.164), email address or webhook URL.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.updateNotificationChannel({
			auth: context.auth,
			channelId: p.channelId,
			body: telnyxUtils.compact({
				values: {
					notification_profile_id: p.notificationProfileId,
					channel_type_id: p.channelTypeId,
					channel_destination: p.channelDestination,
				},
			}),
		});
	},
});
