import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

export const apifyGetRunLog = createAction({
  name: 'apify_get_run_log',
  auth: apifyAuth,
  displayName: 'Get Run Log',
  description: 'Retrieves the plain-text log of an Actor run or build by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get the plain-text log of an Actor run (or build) by its ID. Use this to diagnose why a run failed or what it did, after Get Actor Run reports a FAILED/ABORTED status. Pass a run ID (from Run Actor) or a build ID (from Get Build). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    runId: Property.ShortText({
      displayName: 'Run or Build ID',
      description:
        'The run ID (from Run Actor / List Actor Runs) or build ID (from Get Build) whose log to fetch.',
      required: true,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { runId } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const log = await client.log(runId).get();

      if (log == null) {
        throw new Error(
          `No log found for "${runId}". Confirm the run or build ID is valid.`
        );
      }

      return {
        id: runId,
        log,
      };
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied reading log for "${runId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Log for "${runId}" not found. Confirm the run or build ID is valid.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to get run log: ${error.message || error}`);
    }
  },
});
