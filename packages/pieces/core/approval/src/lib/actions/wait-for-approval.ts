import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { ExecutionType, MarkdownVariant } from '@activepieces/pieces-framework';
import { waitForApprovalActionOutputSchema } from '../output-schemas';

export const waitForApprovalLink = createAction({
  audience: 'both',
  auth: PieceAuth.None(),
  name: 'wait_for_approval',
  classification: 'READ',
  displayName: 'Wait for Approval',
  description: 'Pauses the flow until someone approves or disapproves',
  aiMetadata: { description: 'Pauses the current flow run at a human approval gate and resumes only when the run\'s waitpoint resume URL is called with an approve or disapprove response, reporting the choice. Pick this when execution must block on a human decision; it returns no link itself, so use Create Approval Links when the flow should keep running and hand a link out. Takes no inputs and is a legacy piece: for a new flow prefer the approval actions in the Approvals tab, which deliver the request and wait in one step. Not idempotent, since each execution creates a new waitpoint.', idempotent: false },
  outputSchema: waitForApprovalActionOutputSchema,
  props: {
    markdown: Property.MarkDown({
      variant: MarkdownVariant.INFO,
      value:
        'Pauses the flow until someone picks Approve or Disapprove. They answer through the link from a **Create Approval Links** step earlier in this flow; send it to them by email or chat before this step.\n\nThis piece is legacy but still supported. For a new flow, prefer the approval actions in the Approvals tab, which send the request and wait for the answer in one step.',
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
