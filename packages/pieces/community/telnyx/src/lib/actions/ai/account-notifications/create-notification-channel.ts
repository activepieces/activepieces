import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxCreateNotificationChannelAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_create_notification_channel',
	displayName: 'Create Notification Channel',
	description: 'Adds a destination for account notifications.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a notification channel: where notifications of a notification profile are delivered (SMS or voice number in E.164, email address or webhook URL). Create the profile first with Create Notification Profile. Not idempotent: every call adds a channel.',
		idempotent: false,
	},
	props: {
		notificationProfileId: Property.ShortText({
			displayName: 'Notification Profile ID',
			description: 'Notification profile UUID. Use List Notification Profiles to find it.',
			required: true,
		}),
		channelTypeId: Property.StaticDropdown({
			displayName: 'Channel Type',
			description: 'How notifications are delivered.',
			required: true,
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
			description: 'Phone number (E.164) for SMS/voice, email address, or webhook URL.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.createNotificationChannel({
			auth: context.auth,
			body: {
				notification_profile_id: p.notificationProfileId,
				channel_type_id: p.channelTypeId,
				channel_destination: p.channelDestination,
			},
		});
	},
});
