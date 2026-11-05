import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetUserNotificationSettingOutputSchema } from '../../../output-schemas';

export const getUserNotificationSettingAction = createAction({
  auth: podioAuth,
  name: 'podio_get_user_notification_setting',
  outputSchema: podioGetUserNotificationSettingOutputSchema,
  displayName: 'Get User Notification Setting',
  description: 'Gets whether one notification type is enabled for email or mobile.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads whether one notification type is enabled for the connected user on email or mobile. For every type of a client at once use Get User Notification Settings.',
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
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/user/setting/${propsValue.clientType}/${propsValue.notificationType}` });
  },
});
