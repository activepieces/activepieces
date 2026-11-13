import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const unstarNotificationAction = createAction({
  auth: podioAuth,
  name: 'podio_unstar_notification',
  displayName: 'Unstar Notification',
  description: 'Removes the star from a notification.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Removes the star from one Podio notification; Star Notification reverses it. The notification id comes from Get Notifications.',
    idempotent: true,
  },
  props: {
    notificationId: podioAiProps.id({ required: true, displayName: 'Notification ID', description: 'The id of the notification, from Get Notifications.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/notification/${propsValue.notificationId}/star` });
  },
});
