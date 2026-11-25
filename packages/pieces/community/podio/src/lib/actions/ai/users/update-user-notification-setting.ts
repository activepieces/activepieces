import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateUserNotificationSettingAction = createAction({
  auth: podioAuth,
  name: 'podio_update_user_notification_setting',
  displayName: 'Update User Notification Setting',
  description: 'Turns one notification type on or off for email or mobile.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Enables or disables one notification type for the connected user on email or mobile. To set several types at once use Update User Notification Settings.',
    idempotent: true,
  },
  props: {
    clientType: podioAiProps.choice({ required: true, displayName: 'Client Type', description: 'Which notifications: "email" or "mobile".', values: ['email', 'mobile'] }),
    notificationType: podioAiProps.choice({
      required: true,
      displayName: 'Notification Type',
      description: 'The notification type.',
      values: ['digest', 'bulletin', 'reference', 'message', 'space', 'subscription', 'user', 'reminder', 'push_notification', 'push_notification_sound', 'push_notification_browser'],
    }),
    value: podioAiProps.bool({ required: true, displayName: 'Enabled', description: '"true" turns the notification on, "false" turns it off.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/user/setting/${propsValue.clientType}/${propsValue.notificationType}`,
      body: { value: podioUtils.toBool({ value: propsValue.value }) },
    });
  },
});
