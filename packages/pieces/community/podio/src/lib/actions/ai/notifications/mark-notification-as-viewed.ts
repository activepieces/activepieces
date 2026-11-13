import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const markNotificationAsViewedAction = createAction({
  auth: podioAuth,
  name: 'podio_mark_notification_as_viewed',
  displayName: 'Mark Notification As Viewed',
  description: 'Marks one notification as viewed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks one Podio notification as viewed, moving it from the inbox to the viewed archive; Mark Notification As Unviewed reverses it. The notification id comes from Get Notifications.',
    idempotent: true,
  },
  props: {
    notificationId: podioAiProps.id({ required: true, displayName: 'Notification ID', description: 'The id of the notification, from Get Notifications.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/notification/${propsValue.notificationId}/viewed` });
  },
});
