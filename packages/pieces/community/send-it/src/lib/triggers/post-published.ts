import { createTrigger } from '@activepieces/pieces-framework';
import { sendItAuth } from '../common/auth';
import { sendItWebhookHooks } from '../common/webhook-trigger';
import { sendItOutputSchemas } from '../common/output-schemas';
import { triggerMappers } from '../common/trigger-mappers';

export const postPublishedSampleData = {
  delivery_id: 'dlv_sample123',
  event: 'post.published',
  timestamp: '2026-01-15T10:00:00.000Z',
  content_text: 'Hello world!',
  platform: 'linkedin',
  post_id: 'urn:li:share:12345',
  post_url: 'https://www.linkedin.com/feed/update/urn:li:share:12345',
  published_at: '2026-01-15T10:00:00Z',
};

export const postPublished = createTrigger({
  auth: sendItAuth,
  name: 'post_published',
  displayName: 'Post Published',
  description: 'Triggers when a post is successfully published to a platform',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires when SendIt successfully publishes a post to a connected social platform, representing a completed publication. Each event carries the platform, post ID, post URL, and content of the published post. Deliveries are verified with the X-SendIt-Signature header and deduplicated by delivery ID.',
  },
  props: {},
  outputSchema: sendItOutputSchemas.postPublishedEvent,
  sampleData: postPublishedSampleData,
  ...sendItWebhookHooks({ event: 'post.published', sampleData: postPublishedSampleData, mapEvent: triggerMappers.published }),
});
