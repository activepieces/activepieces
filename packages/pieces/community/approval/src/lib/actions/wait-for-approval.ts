import { Property, createAction } from '@activepieces/pieces-framework';
import { ExecutionType, PauseType, branchedPieceResponse } from '@activepieces/shared';

const message = `
For testing: try either of the links in the 'Create Approval Links' step.
`;

export const waitForApprovalLink = createAction({
  name: 'wait_for_approval',
  displayName: 'Wait for Approval',
  description: 'Pauses the flow and wait for the approval from the user',
  props: {
    markdown: Property.MarkDown({
      value: message
    })
  },
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
      return branchedPieceResponse({
        approved: ctx.resumePayload.queryParams['action'] === 'approve',
        denied: ctx.resumePayload.queryParams['action'] !== 'approve',
      })
    }
  },
});
