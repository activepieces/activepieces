import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsClient } from '../../common/client';
import { gravityformsSendNotificationsOutputSchema } from '../../output-schemas';

export const sendNotificationsAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_send_notifications',
  outputSchema: gravityformsSendNotificationsOutputSchema,
  displayName: 'Send Notifications',
  description: 'Sends an entry\'s form notifications (emails) again.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sends the notifications configured on the entry\'s form for one entry, e.g. to resend a confirmation email. Sends every notification for the event unless Notification IDs is set; notification ids are the keys of "notifications" in Get Form. Each call sends the emails again.',
    idempotent: false,
  },
  props: {
    entryId: gravityFormsAiProps.entryId({ required: true }),
    notificationIds: Property.Array({
      displayName: 'Notification IDs',
      description: 'Only send these notifications, e.g. ["64f23a145de7b"]. Defaults to all notifications for the event.',
      required: false,
    }),
    event: Property.ShortText({
      displayName: 'Event',
      description: 'Notification event to send for, e.g. "form_submission". Defaults to "form_submission".',
      required: false,
    }),
  },
  async run(context) {
    const { entryId, notificationIds, event } = context.propsValue;
    const ids = (notificationIds ?? []).map(String);
    const sent = await gravityFormsClient.request<string[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/entries/${encodeURIComponent(entryId)}/notifications`,
      body: {
        ...(ids.length > 0 ? { _notifications: ids.join(',') } : {}),
        ...(event ? { _event: event } : {}),
      },
    });
    return { notification_ids: sent, count: sent.length };
  },
});
