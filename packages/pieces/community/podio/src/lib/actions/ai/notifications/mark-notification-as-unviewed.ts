import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const markNotificationAsUnviewedAction = createAction({
  auth: podioAuth,
  name: 'podio_mark_notification_as_unviewed',
  displayName: 'Mark Notification As Unviewed',
  description: 'Moves one notification back to your inbox as unviewed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks one Podio notification as unviewed, moving it from the viewed archive back to the inbox; Mark Notification As Viewed reverses it. The notification id comes from Get Notifications.',
    idempotent: true,
  },
  props: {
    notificationId: podioAiProps.id({ required: true, displayName: 'Notification ID', description: 'The id of the notification, from Get Notifications.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/notification/${propsValue.notificationId}/viewed` });
  },
});
