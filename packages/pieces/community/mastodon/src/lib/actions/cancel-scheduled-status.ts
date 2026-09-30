import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonClient } from '../common/client';
import { cancelledScheduledStatusOutputSchema } from '../output-schemas';

export const cancelScheduledStatus = createAction({
  auth: mastodonAuth,
  name: 'cancel_scheduled_status',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Scheduled Status',
  description: 'Cancel a scheduled status so it is never published.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Cancels and deletes a scheduled status so it is never published. Use Reschedule Status to move it instead. Irreversible; repeating the call fails with not found.',
    idempotent: false,
  },
  outputSchema: cancelledScheduledStatusOutputSchema,
  props: {
    scheduled_status_id: Property.ShortText({
      displayName: 'Scheduled Status ID',
      description:
        'ID of the scheduled status. Obtain it from Schedule Status or List Scheduled Statuses.',
      required: true,
    }),
  },
  async run(context) {
    await mastodonClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.DELETE,
      path: `/api/v1/scheduled_statuses/${encodeURIComponent(context.propsValue.scheduled_status_id)}`,
      operation: 'Cancel Scheduled Status',
      scope: 'write:statuses',
    });
    return { success: true, scheduled_status_id: context.propsValue.scheduled_status_id };
  },
});
