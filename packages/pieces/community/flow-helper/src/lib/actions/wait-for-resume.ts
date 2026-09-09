import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { ExecutionType, Property } from '@activepieces/pieces-framework';
import { waitForResumeActionOutputSchema } from '../output-schemas';

export const waitForResume = createAction({
  audience: 'both',
  auth: PieceAuth.None(),
  name: 'wait_for_resume',
  classification: 'READ',
  displayName: 'Wait for Resume',
  description:
    "Pauses the flow on a waitpoint created by Create Waitpoint, and returns the full resume payload (body + query params) when that waitpoint's resume URL is called.",
  aiMetadata: {
    description:
      "Pauses the current flow run on a specific waitpoint (from Create Waitpoint) and resumes only when that waitpoint's resume URL is called, returning the caller's full payload (request body and query params) rather than just an approve/disapprove boolean. Pass the waitpointId returned by Create Waitpoint. Pick this when you post your own interactive control (e.g. a Slack button whose value is the waitpoint's resume URL) and need to inspect who acted or what they sent. Not idempotent, since the waitpoint is consumed on resume.",
    idempotent: false,
  },
  outputSchema: waitForResumeActionOutputSchema,
  props: {
    waitpointId: Property.ShortText({
      displayName: 'Waitpoint ID',
      description:
        "The waitpoint id returned by Create Waitpoint. The flow pauses until this waitpoint's resume URL is called.",
      required: true,
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
      // Park on the waitpoint that Create Waitpoint already minted — do NOT create a
      // new one. The engine's waitForWaitpoint just flags the run paused; the pending
      // waitpoint (whose id + resume URL came from Create Waitpoint) is what resumes it,
      // and it is validated + consumed on resume (single-use).
      ctx.run.waitForWaitpoint(ctx.propsValue.waitpointId);
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
