import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { ExecutionType, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { waitForResumeActionOutputSchema } from '../output-schemas';

export const waitForResume = createAction({
  audience: 'both',
  auth: PieceAuth.None(),
  name: 'wait_for_resume',
  classification: 'READ',
  displayName: 'Wait for Resume',
  description:
    'Pauses the flow until its resume URL is called, then returns the full resume payload (body + query params).',
  aiMetadata: {
    description:
      "Pauses the current flow run and resumes only when the run's waitpoint resume URL is called, returning the caller's full payload (request body and query params) rather than just an approve/disapprove boolean. Pick this when you post your own interactive control (e.g. a Slack button whose value is a resume URL from Create Approval Links) and need to inspect who acted or what they sent on resume. Takes no inputs. Not idempotent, since each execution creates a new waitpoint.",
    idempotent: false,
  },
  outputSchema: waitForResumeActionOutputSchema,
  props: {
    markdown: Property.MarkDown({
      variant: MarkdownVariant.INFO,
      value:
        'Pair this with **Create Approval Links** (which hands out a resume URL without pausing): post your own control (button/link) with that URL, then use this action to pause and read back the full payload when it is called.',
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
        payload: null,
        queryParams: {},
      };
    }

    return {
      payload: ctx.resumePayload?.body ?? null,
      queryParams: ctx.resumePayload?.queryParams ?? {},
    };
  },
});
