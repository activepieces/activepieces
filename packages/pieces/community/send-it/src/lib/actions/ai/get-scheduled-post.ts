import { createAction } from '@activepieces/pieces-framework';
import { sendItAuth } from '../../common/auth';
import { aiProps } from '../../common/ai-props';
import { apiKeyOf } from '../../common/client';
import { sendItOutputSchemas } from '../../common/output-schemas';
import { sendItRequests } from '../../common/requests';

export const getScheduledPost = createAction({
  auth: sendItAuth,
  name: 'get_scheduled_post',
  classification: 'READ',
  displayName: 'Get Scheduled Post',
  description: 'Gets one pending scheduled post by schedule ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets one pending scheduled post (platforms, content, scheduledTime) by schedule ID. Fails with a clear message when the ID is not pending (already published, cancelled or unknown). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    scheduleId: aiProps.scheduleId(),
  },
  outputSchema: sendItOutputSchemas.scheduledPost,
  async run(context) {
    return sendItRequests.getScheduled({ apiKey: apiKeyOf(context.auth), scheduleId: context.propsValue.scheduleId });
  },
});
