import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonClient } from '../common/client';
import { dismissedNotificationOutputSchema } from '../output-schemas';

export const dismissNotification = createAction({
  auth: mastodonAuth,
  name: 'dismiss_notification',
  classification: 'DESTRUCTIVE',
  displayName: 'Dismiss Notification',
  description: 'Dismiss a single notification.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Dismisses (removes) one notification of the connected account. Use Clear Notifications to remove all of them. Irreversible; repeating the call fails with not found.',
    idempotent: false,
  },
  outputSchema: dismissedNotificationOutputSchema,
  props: {
    notification_id: Property.ShortText({
      displayName: 'Notification ID',
      description:
        'ID of the notification. Obtain it from List Notifications.',
      required: true,
    }),
  },
  async run(context) {
    await mastodonClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/api/v1/notifications/${encodeURIComponent(context.propsValue.notification_id)}/dismiss`,
      operation: 'Dismiss Notification',
      scope: 'write:notifications',
    });
    return { success: true, notification_id: context.propsValue.notification_id };
  },
});
