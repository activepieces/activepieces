import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonUtils } from '../common/client';
import { scheduledStatusOutputSchema } from '../output-schemas';

export const rescheduleStatus = createAction({
  auth: mastodonAuth,
  name: 'reschedule_status',
  classification: 'WRITE',
  displayName: 'Reschedule Status',
  description: 'Change the publication time of a scheduled status.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves a scheduled status to a new publication time (at least 5 minutes ahead); its content cannot be changed here. Use Cancel Scheduled Status to drop it instead. Setting the same time again converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: scheduledStatusOutputSchema,
  props: {
    scheduled_status_id: Property.ShortText({
      displayName: 'Scheduled Status ID',
      description:
        'ID of the scheduled status. Obtain it from Schedule Status or List Scheduled Statuses.',
      required: true,
    }),
    scheduled_at: Property.DateTime({
      displayName: 'Scheduled At',
      description:
        'New publication time as an ISO 8601 date-time such as 2026-10-01T09:30:00Z. Must be at least 5 minutes in the future.',
      required: true,
    }),
  },
  async run(context) {
    const { scheduled_status_id, scheduled_at } = context.propsValue;
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.PUT,
      path: `/api/v1/scheduled_statuses/${encodeURIComponent(scheduled_status_id)}`,
      operation: 'Reschedule Status',
      scope: 'write:statuses',
      body: { scheduled_at: mastodonUtils.assertScheduledAt(scheduled_at) },
    });
  },
});
