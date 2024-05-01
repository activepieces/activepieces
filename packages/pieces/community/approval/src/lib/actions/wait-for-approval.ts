import { createAction } from '@activepieces/pieces-framework';
import { ExecutionType, PauseType } from '@activepieces/shared';

export const waitForApprovalLink = createAction({
  name: 'wait_for_approval',
  displayName: 'Wait for Approval',
  description: 'Pauses the flow and wait for the approval from the user',
  props: {},
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  outputs: ['approved', 'denied'],
  async run(ctx) {
    if (ctx.executionType === ExecutionType.BEGIN) {
      ctx.run.pause({
        pauseMetadata: {
          type: PauseType.WEBHOOK,
          response: {}
        },
      });

      return {}
    } else {
      const action = ctx.resumePayload.queryParams['action'];
      
      if (action === 'approve') {
        return {
          approved: true,
          denied: false,
        };
      } else {
        return {
          approved: false,
          denied: true,
        };
      }
    }
  },
});
