import { createTrigger } from '@activepieces/pieces-framework';
import { sendItAuth } from '../common/auth';
import { sendItWebhookHooks } from '../common/webhook-trigger';
import { sendItOutputSchemas } from '../common/output-schemas';
import { triggerMappers } from '../common/trigger-mappers';

export const postFailedSampleData = {
  delivery_id: 'dlv_sample789',
  event: 'post.failed',
  timestamp: '2026-01-15T10:05:00.000Z',
  content_text: 'Check this out!',
  platform: 'instagram',
  error: 'Media URL is not accessible',
  failed_at: '2026-01-15T10:05:00Z',
};

export const postFailed = createTrigger({
  auth: sendItAuth,
  name: 'post_failed',
  displayName: 'Post Failed',
  description: 'Triggers when a post fails to publish to a platform',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires when SendIt fails to publish a post to a connected social platform, representing a failed publication attempt. Each event carries the platform, the post content, and an error message describing why it failed. Deliveries are verified with the X-SendIt-Signature header and deduplicated by delivery ID.',
  },
  props: {},
  outputSchema: sendItOutputSchemas.postFailedEvent,
  sampleData: postFailedSampleData,
  ...sendItWebhookHooks({ event: 'post.failed', sampleData: postFailedSampleData, mapEvent: triggerMappers.failed }),
});
