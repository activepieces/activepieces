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

const composeProps = mastodonProps.compose();

export const scheduleStatus = createAction({
  auth: mastodonAuth,
  name: 'schedule_status',
  classification: 'WRITE',
  displayName: 'Schedule Status',
  description: 'Schedule a status to be published at a later time.',
  audience: 'both',
  aiMetadata: {
    description:
      'Schedules a status to be published by Mastodon at a future date-time (at least 5 minutes ahead) and returns the scheduled status, not a published post. Use Create Status to post immediately; manage the result with List Scheduled Statuses, Reschedule Status or Cancel Scheduled Status. Each call schedules another post.',
    idempotent: false,
  },
  outputSchema: scheduledStatusOutputSchema,
  propertyGroups: [
    {
      key: 'when',
      display: 'section',
      label: 'When',
      icon: 'calendar',
      props: ['scheduled_at'],
    },
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['status', 'spoiler_text', 'language'],
    },
    {
      key: 'media',
      display: 'section',
      label: 'Media',
      icon: 'paperclip',
      props: ['media_ids', 'sensitive'],
    },
    {
      key: 'poll',
      display: 'section',
      label: 'Poll',
      icon: 'sliders',
      props: ['poll_options', 'poll_expires_in', 'poll_multiple'],
    },
    {
      key: 'delivery',
      display: 'section',
      label: 'Delivery',
      icon: 'send',
      props: ['visibility', 'in_reply_to_id'],
    },
  ],
  props: {
    scheduled_at: Property.DateTime({
      displayName: 'Scheduled At',
      description:
        'At least 6 minutes from now; Mastodon needs 5, plus a minute for clock drift.',
      placeholder: '2026-10-01T09:30:00Z',
      required: true,
    }),
    ...composeProps,
    spoiler_text: halfWidth(composeProps.spoiler_text),
    language: halfWidth(composeProps.language),
    idempotency_key: Property.ShortText({
      displayName: 'Deduplication Key',
      description: 'Reuse a key on retries within an hour so the status is scheduled once.',
      required: false,
      advanced: true,
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

function halfWidth<T extends { width?: 'half' | 'full' }>(property: T): T {
  return { ...property, width: 'half' };
}
