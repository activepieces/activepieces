import { createAction } from '@activepieces/pieces-framework';
import { sendItAuth } from '../../common/auth';
import { aiProps } from '../../common/ai-props';
import { apiKeyOf } from '../../common/client';
import { sendItOutputSchemas } from '../../common/output-schemas';
import { sendItRequests } from '../../common/requests';

export const cancelScheduledPostById = createAction({
  auth: sendItAuth,
  name: 'cancel_scheduled_post_by_id',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Scheduled Post by ID',
  description: 'Cancels a pending scheduled post by schedule ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Cancels one pending scheduled post by its schedule ID (from Schedule Post or List Scheduled Posts) so it will not be published. Not idempotent: an ID that is already cancelled, published or unknown fails with SendIt 404 "Scheduled post not found".',
    idempotent: false,
  },
  props: {
    scheduleId: aiProps.scheduleId(),
  },
  outputSchema: sendItOutputSchemas.cancelResult,
  async run(context) {
    return sendItRequests.cancel({ apiKey: apiKeyOf(context.auth), scheduleId: context.propsValue.scheduleId });
  },
});
