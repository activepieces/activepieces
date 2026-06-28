import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

export const apifyAbortActorRun = createAction({
  name: 'apify_abort_actor_run',
  auth: apifyAuth,
  displayName: 'Abort Actor Run',
  description: 'Stops a running Actor run by run ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Stop an in-progress Actor run by its run ID. Use this to cancel a run started by Run Actor (e.g. one that is taking too long or is no longer needed). Set gracefully=true to let the actor finish its current cycle and persist state; otherwise it is killed immediately. Obtain the run ID from Run Actor or List Actor Runs. Not idempotent — aborting an already-finished run errors.',
    idempotent: false,
  },
  props: {
    runId: Property.ShortText({
      displayName: 'Run ID',
      description:
        'The ID of the run to abort. Obtain it from Run Actor or List Actor Runs.',
      required: true,
    }),
    gracefully: Property.Checkbox({
      displayName: 'Gracefully',
      description:
        'If true, send a graceful abort so the actor can finish its current cycle and persist state before stopping. If false, the run is killed immediately.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { runId, gracefully } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const run = await client.run(runId).abort({ gracefully: gracefully || false });
      return run;
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied aborting run "${runId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Run "${runId}" not found. Obtain a valid run ID from Run Actor or List Actor Runs.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(
        `Failed to abort run "${runId}" (it may already be finished): ${error.message || error}`
      );
    }
  },
});
