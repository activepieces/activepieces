import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { notificationOutputSchema } from '../output-schemas';

export const getNotification = createAction({
  auth: mastodonAuth,
  name: 'get_notification',
  classification: 'READ',
  displayName: 'Get Notification',
  description: 'Get a single notification by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches one notification of the connected account by ID, including its type, the account that triggered it and the related status. Use List Notifications to find IDs. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: notificationOutputSchema,
  props: {
    notification_id: Property.ShortText({
      displayName: 'Notification ID',
      description:
        'ID of the notification. Obtain it from List Notifications.',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/api/v1/notifications/${encodeURIComponent(context.propsValue.notification_id)}`,
      operation: 'Get Notification',
      scope: 'read:notifications',
    });
  },
});
