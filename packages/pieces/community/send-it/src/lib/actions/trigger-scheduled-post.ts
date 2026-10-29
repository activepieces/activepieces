import { createAction } from '@activepieces/pieces-framework';
import { sendItAuth } from '../common/auth';
import { apiKeyOf } from '../common/client';
import { sendItOutputSchemas } from '../common/output-schemas';
import { scheduleIdProperty } from '../common/props';
import { sendItRequests } from '../common/requests';

export const triggerScheduledPost = createAction({
  auth: sendItAuth,
  name: 'trigger_scheduled_post',
  classification: 'WRITE',
  displayName: 'Trigger Scheduled Post Now',
  description: 'Immediately publish a scheduled post',
  audience: 'human',
  aiMetadata: {
    description:
      'Publishes a pending scheduled post chosen from a dropdown right away instead of waiting for its scheduled time. Not idempotent: it performs a real publish.',
    idempotent: false,
  },
  props: {
    scheduleId: scheduleIdProperty,
  },
  outputSchema: sendItOutputSchemas.triggerNowResult,
  async run(context) {
    return sendItRequests.triggerNow({ apiKey: apiKeyOf(context.auth), scheduleId: context.propsValue.scheduleId });
  },
});
