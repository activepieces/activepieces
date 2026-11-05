import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetNotificationOutputSchema } from '../../../output-schemas';

export const getNotificationAction = createAction({
  auth: podioAuth,
  name: 'podio_get_notification',
  outputSchema: podioGetNotificationOutputSchema,
  displayName: 'Get Notification',
  description: 'Gets one notification with its context.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio notification, grouped with its context (the item, task, status or conversation it is about) the same way Get Notifications groups them. The notification id comes from Get Notifications.',
    idempotent: true,
  },
  props: {
    notificationId: podioAiProps.id({ required: true, displayName: 'Notification ID', description: 'The id of the notification, from Get Notifications.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/notification/${propsValue.notificationId}` });
  },
});
