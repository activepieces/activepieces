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
      // Fail fast on a blank id rather than parking the run un-resumably. The engine's
      // waitForWaitpoint just flags the run paused (it does not look the id up), so the
      // run resumes only if a live waitpoint exists for it — which Create Waitpoint must
      // have minted earlier in this same run. A missing/blank id is the realistic
      // misconfiguration (Create Waitpoint not wired in) that would otherwise strand the
      // run, so reject it before pausing.
      const waitpointId = ctx.propsValue.waitpointId?.trim();
      if (!waitpointId) {
        throw new Error(
          'Wait for Resume: waitpointId is empty. Wire in the "Waitpoint ID" output of a Create Waitpoint step that runs earlier in this same flow run.'
        );
      }
      // Park on the waitpoint that Create Waitpoint already minted — do NOT create a
      // new one. The pending waitpoint (whose id + resume URL came from Create Waitpoint)
      // is what resumes the run, and it is validated + consumed on resume (single-use).
      ctx.run.waitForWaitpoint(waitpointId);
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
