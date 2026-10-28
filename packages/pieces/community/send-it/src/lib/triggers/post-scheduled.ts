import { createTrigger } from '@activepieces/pieces-framework';
import { sendItAuth } from '../common/auth';
import { sendItWebhookHooks } from '../common/webhook-trigger';
import { sendItOutputSchemas } from '../common/output-schemas';
import { triggerMappers } from '../common/trigger-mappers';

export const postScheduledSampleData = {
  delivery_id: 'dlv_sample456',
  event: 'post.scheduled',
  timestamp: '2026-01-15T10:00:00.000Z',
  content_text: 'Launching soon!',
  schedule_id: 'sched_abc123',
  platforms: 'linkedin, x',
  scheduled_time: '2026-01-20T14:00:00Z',
};

export const postScheduled = createTrigger({
  auth: sendItAuth,
  name: 'post_scheduled',
  displayName: 'Post Scheduled',
  description: 'Triggers when a post is scheduled for future publishing',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires when a post is queued in SendIt for future publishing, representing a newly created schedule. Each event carries the schedule ID, target platforms (comma-separated), content, and the scheduled publish time. Deliveries are verified with the X-SendIt-Signature header and deduplicated by delivery ID.',
  },
  props: {},
  outputSchema: sendItOutputSchemas.postScheduledEvent,
  sampleData: postScheduledSampleData,
  ...sendItWebhookHooks({ event: 'post.scheduled', sampleData: postScheduledSampleData, mapEvent: triggerMappers.scheduled }),
});
