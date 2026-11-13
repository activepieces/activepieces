import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetUserNotificationSettingsOutputSchema } from '../../../output-schemas';

export const updateUserNotificationSettingsAction = createAction({
  auth: podioAuth,
  name: 'podio_update_user_notification_settings',
  outputSchema: podioGetUserNotificationSettingsOutputSchema,
  displayName: 'Update User Notification Settings',
  description: 'Turns several notification types on or off for email or mobile.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Enables or disables several notification types for the connected user on email or mobile in one call; types not named keep their setting. Read the current values with Get User Notification Settings.',
    idempotent: true,
  },
  props: {
    clientType: podioAiProps.choice({ required: true, displayName: 'Client Type', description: 'Which notifications: "email" or "mobile".', values: ['email', 'mobile'] }),
    settings: podioAiProps.json({
      required: true,
      displayName: 'Settings',
      description:
        'An object mapping notification types (digest, bulletin, reference, message, space, subscription, user, reminder, push_notification, push_notification_sound, push_notification_browser) to true or false, e.g. {"digest": false}.',
    }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.PUT, path: `/user/setting/${propsValue.clientType}/`, body: propsValue.settings });
  },
});
