import { createAction } from '@activepieces/pieces-framework';
import { sendItAuth } from '../../common/auth';
import { aiProps } from '../../common/ai-props';
import { apiKeyOf } from '../../common/client';
import { sendItOutputSchemas } from '../../common/output-schemas';
import { sendItRequests } from '../../common/requests';

export const publishScheduledPostNow = createAction({
  auth: sendItAuth,
  name: 'publish_scheduled_post_now',
  classification: 'WRITE',
  displayName: 'Publish Scheduled Post Now',
  description: 'Publishes a pending scheduled post immediately, by schedule ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publishes one pending scheduled post right now instead of at its scheduled time, by schedule ID (from Schedule Post or List Scheduled Posts). Returns per-platform results with post IDs and URLs. Not idempotent: it performs a real publish that counts against the plan post quota; an unknown or already-published ID fails with SendIt 404.',
    idempotent: false,
  },
  props: {
    scheduleId: aiProps.scheduleId(),
  },
  outputSchema: sendItOutputSchemas.triggerNowResult,
  async run(context) {
    return sendItRequests.triggerNow({ apiKey: apiKeyOf(context.auth), scheduleId: context.propsValue.scheduleId });
  },
});
