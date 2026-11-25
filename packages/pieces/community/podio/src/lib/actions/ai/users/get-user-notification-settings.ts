import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetUserNotificationSettingsOutputSchema } from '../../../output-schemas';

export const getUserNotificationSettingsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_user_notification_settings',
  outputSchema: podioGetUserNotificationSettingsOutputSchema,
  displayName: 'Get User Notification Settings',
  description: 'Gets which notification types are enabled for email or mobile.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads, for email or mobile, whether each notification type is enabled for the connected user, as one true/false value per type.',
    idempotent: true,
  },
  props: {
    clientType: podioAiProps.choice({ required: true, displayName: 'Client Type', description: 'Which notifications: "email" or "mobile".', values: ['email', 'mobile'] }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/user/setting/${propsValue.clientType}/` });
  },
});
