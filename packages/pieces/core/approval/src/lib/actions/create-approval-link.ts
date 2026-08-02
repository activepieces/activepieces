import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/pieces-framework';

export const createApprovalLink = createAction({
  audience: 'both',
  auth: PieceAuth.None(),
  name: 'create_approval_links',
  displayName: 'Create Approval Links',
  description:
    'Create links only without pausing the flow, use wait for approval to pause',
  aiMetadata: { description: 'Mints a resumable approval/disapproval link for the current flow run and returns it immediately without pausing execution, so a later step can email or post it. Pick this when the flow must continue after handing out the link; use Wait for Approval instead when the run should block until someone responds. Takes no inputs and is a legacy piece (prefer the Manual Task feature on 0.48.0 and above); not idempotent, since each call creates a new waitpoint and the previously issued link is not returned.', idempotent: false },
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
