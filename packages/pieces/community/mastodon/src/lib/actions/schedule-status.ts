import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import {
  MastodonEntity,
  mastodonClient,
  mastodonProps,
  mastodonUtils,
} from '../common/client';
import { scheduledStatusOutputSchema } from '../output-schemas';

export const scheduleStatus = createAction({
  auth: mastodonAuth,
  name: 'schedule_status',
  classification: 'WRITE',
  displayName: 'Schedule Status',
  description: 'Schedule a status to be published automatically at a future time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Schedules a status to be published by Mastodon at a future date-time (at least 5 minutes ahead) and returns the scheduled status, not a published post. Use Create Status to post immediately; manage the result with List Scheduled Statuses, Reschedule Status or Cancel Scheduled Status. Each call schedules another post.',
    idempotent: false,
  },
  outputSchema: scheduledStatusOutputSchema,
  props: {
    scheduled_at: Property.DateTime({
      displayName: 'Scheduled At',
      description:
        'When to publish, as an ISO 8601 date-time such as 2026-10-01T09:30:00Z. Must be at least 5 minutes in the future.',
      required: true,
    }),
    ...mastodonProps.compose(),
    idempotency_key: Property.ShortText({
      displayName: 'Idempotency Key',
      description:
        'Optional unique string (for example a UUID). Mastodon keeps it for up to 1 hour and ignores a duplicate submission with the same key.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const scheduledAt = mastodonUtils.assertScheduledAt(props.scheduled_at);
    const body = mastodonUtils.buildComposeBody({
      status: props.status,
      visibility: props.visibility,
      inReplyToId: props.in_reply_to_id,
      spoilerText: props.spoiler_text,
      sensitive: props.sensitive,
      language: props.language,
      mediaIds: mastodonUtils.toStringArray(props.media_ids),
      pollOptions: mastodonUtils.toStringArray(props.poll_options),
      pollExpiresIn: props.poll_expires_in,
      pollMultiple: props.poll_multiple,
    });
    const idempotencyKey = props.idempotency_key;
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/api/v1/statuses',
      operation: 'Schedule Status',
      scope: 'write:statuses',
      body: { ...body, scheduled_at: scheduledAt },
      headers: mastodonUtils.hasValue(idempotencyKey)
        ? { 'Idempotency-Key': String(idempotencyKey) }
        : undefined,
    });
  },
});
