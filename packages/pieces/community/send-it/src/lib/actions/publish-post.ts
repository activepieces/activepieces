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
  textProperty,
  titleProperty,
} from '../common/props';
import { sendItRequests } from '../common/requests';

export const publishPost = createAction({
  auth: sendItAuth,
  name: 'publish_post',
  classification: 'WRITE',
  displayName: 'Publish Post',
  description: 'Publish content to social media platforms immediately',
  audience: 'both',
  aiMetadata: {
    description:
      'Immediately publishes a post (text plus optional image/video URL or a multi-image carousel) to one or more connected social platforms (X, LinkedIn, Instagram, Threads, Bluesky, TikTok and others). Use Schedule Post to publish later. Each selected platform must be connected in SendIt (check with List Connected Accounts); Instagram, Pinterest, TikTok and YouTube require a public https media URL. Each publish counts against the SendIt plan post quota (Free: 30 per month). Returns per-platform results with post IDs and URLs. Not idempotent: every call publishes a new post. An Idempotency-Key header is sent, but SendIt was not seen to deduplicate on it, so do not retry blindly after a timeout; check the account first.',
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
    idempotencyKey: idempotencyKeyProperty,
  },
  outputSchema: sendItOutputSchemas.publishResult,
  async run(context) {
    const { idempotencyKey, ...input } = context.propsValue;
    return sendItRequests.publish({
      apiKey: apiKeyOf(context.auth),
      input,
      key: sendItRequests.idempotencyKey({ override: idempotencyKey, runId: context.run.id, stepName: context.step.name, input, operation: 'publish' }),
    });
  },
});
