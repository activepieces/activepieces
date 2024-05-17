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
  outputs: {
    approved: {}, 
    denied: {}
  },
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
      const action = ctx.resumePayload.queryParams['action']
      switch(action) {
        case 'approve':
          return branchedPieceResponse({
            approved: true
          })
        case 'deny':
          return branchedPieceResponse({
            denied: true
          })
        default:
          throw new Error(JSON.stringify({
            message: `The url were called with invalid action ${action}.`
          }))
      }
    }
  },
});
