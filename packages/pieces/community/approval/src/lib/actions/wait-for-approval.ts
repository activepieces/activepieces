import { createAction } from '@activepieces/pieces-framework';
import { ExecutionType, PauseType } from '@activepieces/shared';

export const waitForApprovalLink = createAction({
  name: 'wait_for_approval',
  displayName: 'Wait for Approval',
  description: 'Pauses the flow and wait for the approval from the user',
  props: {},
  async run(ctx) {
    if (ctx.executionType === ExecutionType.BEGIN) {
      ctx.run.pause({
        pauseMetadata: {
          type: PauseType.WEBHOOK,
          metadata: {}
        },
      });

      return {
        approved: true,
      };
    } else {
      return {
        approved: ctx.resumePayload.payload.queryParams['action'] === 'approve',
      };
    }
  },
});
