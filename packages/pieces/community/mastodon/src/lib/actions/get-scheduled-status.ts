import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { scheduledStatusOutputSchema } from '../output-schemas';

export const getScheduledStatus = createAction({
  auth: mastodonAuth,
  name: 'get_scheduled_status',
  classification: 'READ',
  displayName: 'Get Scheduled Status',
  description: 'Get a scheduled status by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches one scheduled (not yet published) status by ID, including its scheduled time and parameters. Use List Scheduled Statuses to find IDs. Read-only and safe to retry.',
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
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/api/v1/scheduled_statuses/${encodeURIComponent(context.propsValue.scheduled_status_id)}`,
      operation: 'Get Scheduled Status',
      scope: 'read:statuses',
    });
  },
});
