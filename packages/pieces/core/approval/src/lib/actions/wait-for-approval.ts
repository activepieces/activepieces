import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { ExecutionType, MarkdownVariant } from '@activepieces/pieces-framework';

export const waitForApprovalLink = createAction({
  audience: 'both',
  auth: PieceAuth.None(),
  name: 'wait_for_approval',
  displayName: 'Wait for Approval',
  description: 'Pauses the flow and wait for the approval from the user',
  aiMetadata: { description: 'Pauses the current flow run at a human approval gate and resumes only when the run\'s waitpoint resume URL is called with an approve or disapprove response, reporting the choice. Pick this when execution must block on a human decision; it returns no link itself, so use Create Approval Links when the flow should keep running and hand a link out. Takes no inputs and is a legacy piece (prefer the Manual Task feature on 0.48.0 and above); not idempotent, since each execution creates a new waitpoint.', idempotent: false },
  props: {
    markdown: Property.MarkDown({
      variant: MarkdownVariant.WARNING,
      value: 'Please use Manual Task feature instead from 0.48.0 and above',
    }),
  },
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  async run(ctx) {
    if (ctx.executionType === ExecutionType.BEGIN) {
      const waitpoint = await ctx.run.createWaitpoint({
        type: 'WEBHOOK',
      });
      ctx.run.waitForWaitpoint(waitpoint.id);

      return {
        approved: true,
      };
    } else {
      return {
        approved: ctx.resumePayload.queryParams['action'] === 'approve',
      };
    }
  },
});
