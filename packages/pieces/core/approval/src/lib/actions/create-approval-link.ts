import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { createApprovalLinkActionOutputSchema } from '../output-schemas';

export const createApprovalLink = createAction({
  audience: 'both',
  auth: PieceAuth.None(),
  name: 'create_approval_links',
  classification: 'READ',
  displayName: 'Create Approval Links',
  description:
    'Create links only without pausing the flow, use wait for approval to pause',
  aiMetadata: { description: 'Mints a resumable approval/disapproval link for the current flow run and returns it immediately without pausing execution, so a later step can email or post it. Pick this when the flow must continue after handing out the link; use Wait for Approval instead when the run should block until someone responds. Takes no inputs and is a legacy piece that remains supported because, unlike the approval actions in the Approvals tab, it hands out a link without pausing the run. Not idempotent, since each call creates a new waitpoint and the previously issued link is not returned.', idempotent: false },
  outputSchema: createApprovalLinkActionOutputSchema,
  props: {
    markdown: Property.MarkDown({
      variant: MarkdownVariant.INFO,
      value: 'This piece is legacy but still supported. Unlike the approval actions in the Approvals tab, it hands out a link without pausing the flow.',
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
    const waitpoint = await ctx.run.createWaitpoint({
      type: 'WEBHOOK',
    });
    const confirmationLink = `${waitpoint.resumeUrl}/confirm`;
    return {
      approvalLink: confirmationLink,
      disapprovalLink: confirmationLink,
    };
  },
});
