import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxCreateNotificationSettingAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_create_notification_setting',
	displayName: 'Create Notification Setting',
	description: 'Subscribes a notification channel to an event.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a notification setting: notify a channel of a profile when an event condition fires. Get the condition id from List Notification Event Conditions, and the profile and channel ids from List Notification Profiles and List Notification Channels. Some conditions need Parameters. Not idempotent: every call adds a setting.',
		idempotent: false,
	},
	props: {
		notificationEventConditionId: Property.ShortText({
			displayName: 'Event Condition ID',
			description: 'Event condition UUID. Use List Notification Event Conditions to find it.',
			required: true,
		}),
		notificationProfileId: Property.ShortText({
			displayName: 'Notification Profile ID',
			description: 'Notification profile UUID. Use List Notification Profiles to find it.',
			required: true,
		}),
		notificationChannelId: Property.ShortText({
			displayName: 'Notification Channel ID',
			description: 'Notification channel UUID. Use List Notification Channels to find it.',
			required: true,
		}),
		associatedRecordType: Property.ShortText({
			displayName: 'Associated Record Type',
			description: 'Optional record type the setting applies to, e.g. "account" or "phone_number".',
			required: false,
		}),
		associatedRecordTypeValue: Property.ShortText({
			displayName: 'Associated Record Value',
			description: 'Optional value of the associated record, e.g. a phone number.',
			required: false,
		}),
		parameters: Property.Json({
			displayName: 'Parameters',
			description:
				'Optional JSON array of {"name": ..., "value": ...} objects required by the event condition, e.g. [{"name": "balance_threshold", "value": "10"}].',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.createNotificationSetting({
			auth: context.auth,
			body: telnyxUtils.compact({
				values: {
					notification_event_condition_id: p.notificationEventConditionId,
					notification_profile_id: p.notificationProfileId,
					notification_channel_id: p.notificationChannelId,
					associated_record_type: p.associatedRecordType,
					associated_record_type_value: p.associatedRecordTypeValue,
					parameters: p.parameters,
				},
			}),
		});
	},
});
