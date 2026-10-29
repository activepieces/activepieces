import { createAction } from '@activepieces/pieces-framework';
import { sendItAuth } from '../common/auth';
import { apiKeyOf } from '../common/client';
import { sendItOutputSchemas } from '../common/output-schemas';
import { scheduleIdProperty } from '../common/props';
import { sendItRequests } from '../common/requests';

export const cancelScheduledPost = createAction({
  auth: sendItAuth,
  name: 'cancel_scheduled_post',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Scheduled Post',
  description: 'Cancel a scheduled post before it is published',
  audience: 'human',
  aiMetadata: {
    description:
      'Cancels a pending scheduled post chosen from a dropdown so it will not be published. Not idempotent: SendIt returns 404 "Scheduled post not found" for an ID that is already cancelled, published or unknown.',
    idempotent: false,
  },
  props: {
    scheduleId: scheduleIdProperty,
  },
  outputSchema: sendItOutputSchemas.cancelResult,
  async run(context) {
    return sendItRequests.cancel({ apiKey: apiKeyOf(context.auth), scheduleId: context.propsValue.scheduleId });
  },
});
