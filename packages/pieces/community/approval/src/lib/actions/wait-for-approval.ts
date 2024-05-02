import { createAction } from '@activepieces/pieces-framework';
import { ExecutionType, PauseType, branchedPieceResponse } from '@activepieces/shared';

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
  outputs: [
    { name: 'approved' }, 
    { name: 'denied' }
  ],
  async run(ctx) {
    if (ctx.executionType === ExecutionType.BEGIN) {
      ctx.run.pause({
        pauseMetadata: {
          type: PauseType.WEBHOOK,
          response: {},
        },
      });

      return branchedPieceResponse()
    } else {
      const op = {
        approved: ctx.resumePayload.queryParams['action'] === 'approve',
        denied: ctx.resumePayload.queryParams['action'] !== 'approve',
      }
      return branchedPieceResponse(op)
    }
  },
});
