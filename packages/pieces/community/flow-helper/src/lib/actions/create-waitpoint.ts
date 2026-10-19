import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { createWaitpointActionOutputSchema } from '../output-schemas';

export const createWaitpoint = createAction({
  audience: 'both',
  auth: PieceAuth.None(),
  name: 'create_waitpoint',
  classification: 'READ',
  displayName: 'Create Waitpoint',
  description:
    'Creates a resumable waitpoint and returns its resume URL immediately, without pausing the flow. Pair with Wait for Resume.',
  aiMetadata: {
    description:
      "Mints a resumable waitpoint for the current flow run and returns its id and resume URL without pausing, so a later step can embed the URL in a control you post yourself (e.g. a Slack button whose value is the resume URL). Calling that URL resumes the run. Pick this together with Wait for Resume when you want full control over the message/UI that carries the resume action; use Wait for Approval for a simple built-in approve/disapprove gate. Takes no inputs. Not idempotent, since each call creates a new waitpoint.",
    idempotent: false,
  },
  outputSchema: createWaitpointActionOutputSchema,
  props: {
    markdown: Property.MarkDown({
      variant: MarkdownVariant.INFO,
      value:
        'Returns a **resume URL** without pausing. Post your own control (e.g. a Slack button) whose value is this URL, then use **Wait for Resume** to pause and read the full payload when it is called.\n\n**Only one waitpoint can be pending per flow run at a time** — create it, embed its URL, and pause with Wait for Resume before creating another.',
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
    return {
      waitpointId: waitpoint.id,
      resumeUrl: waitpoint.resumeUrl,
    };
  },
});
