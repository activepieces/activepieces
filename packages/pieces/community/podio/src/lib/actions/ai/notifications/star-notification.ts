import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const starNotificationAction = createAction({
  auth: podioAuth,
  name: 'podio_star_notification',
  displayName: 'Star Notification',
  description: 'Stars a notification.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Stars one Podio notification so it shows in the starred list (Get Notifications with Starred set to "true"); Unstar Notification reverses it. The notification id comes from Get Notifications.',
    idempotent: true,
  },
  props: {
    notificationId: podioAiProps.id({ required: true, displayName: 'Notification ID', description: 'The id of the notification, from Get Notifications.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/notification/${propsValue.notificationId}/star` });
  },
});
