import { createAction } from '@activepieces/pieces-framework';
import { sendItAuth } from '../common/auth';
import { apiKeyOf } from '../common/client';
import { sendItOutputSchemas } from '../common/output-schemas';
import {
  firstCommentProperty,
  idempotencyKeyProperty,
  mediaTypeProperty,
  mediaUrlProperty,
  mediaUrlsProperty,
  platformProperty,
  platformSettingsProperty,
  scheduledTimeProperty,
  textProperty,
  titleProperty,
} from '../common/props';
import { sendItRequests } from '../common/requests';

export const schedulePost = createAction({
  auth: sendItAuth,
  name: 'schedule_post',
  classification: 'WRITE',
  displayName: 'Schedule Post',
  description: 'Schedule content to be published at a future time',
  audience: 'both',
  aiMetadata: {
    description:
      'Queues a post (text plus optional media URL or carousel) to be published at a future ISO-8601 time (UTC) on one or more connected social platforms. Use Publish Post to send immediately. Rejects past times and missing media for Instagram, Pinterest, TikTok and YouTube before calling SendIt. Returns the scheduleId to pass to the cancel or publish-now actions. Each scheduled post counts against the plan post quota once published. Not idempotent: every call creates a new schedule, even with the same Idempotency-Key (verified live), so check List Scheduled Posts before retrying.',
    idempotent: false,
  },
  props: {
    platforms: platformProperty,
    text: textProperty,
    mediaUrl: mediaUrlProperty,
    mediaUrls: mediaUrlsProperty,
    mediaType: mediaTypeProperty,
    title: titleProperty,
    firstComment: firstCommentProperty,
    platformSettings: platformSettingsProperty,
    scheduledTime: scheduledTimeProperty,
    idempotencyKey: idempotencyKeyProperty,
  },
  outputSchema: sendItOutputSchemas.scheduleResult,
  async run(context) {
    const { idempotencyKey, scheduledTime, ...input } = context.propsValue;
    return sendItRequests.schedule({
      apiKey: apiKeyOf(context.auth),
      input,
      scheduledTime,
      key: sendItRequests.idempotencyKey({ override: idempotencyKey, runId: context.run.id, stepName: context.step.name, input: { ...input, scheduledTime }, operation: 'schedule' }),
    });
  },
});
