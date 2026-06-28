import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

export const apifyGetActorRun = createAction({
  name: 'apify_get_actor_run',
  auth: apifyAuth,
  displayName: 'Get Actor Run',
  description: 'Retrieves the status and details of an Actor run by run ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read the current status and details of one Actor run by its run ID (status, defaultDatasetId, defaultKeyValueStoreId, exit fields). This is the poll primitive: call it repeatedly to check whether an async run from Run Actor has finished, then read results with Get Run Dataset Items. Optionally set waitForFinish (seconds, max 60) to block server-side. Obtain the run ID from Run Actor or Get Last Actor Run. Read-only and idempotent; this performs a single status read, not an unbounded wait.',
    idempotent: true,
  },
  props: {
    runId: Property.ShortText({
      displayName: 'Run ID',
      description:
        'The ID of the run to read. Obtain it from Run Actor, List Actor Runs, or Get Last Actor Run.',
      required: true,
    }),
    waitForFinish: Property.Number({
      displayName: 'Wait For Finish (seconds)',
      description:
        'Optional. Block server-side up to this many seconds (max 60) waiting for the run to reach a terminal state before returning. Leave empty for an immediate status read.',
      required: false,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { runId, waitForFinish } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const options =
        waitForFinish != null
          ? { waitForFinish: Math.min(Math.max(waitForFinish, 0), 60) }
          : undefined;
      const run = await client.run(runId).get(options);

      if (!run) {
        throw new Error(
          `Run "${runId}" not found. Obtain a valid run ID from Run Actor or List Actor Runs.`
        );
      }
      return run;
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied reading run "${runId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Run "${runId}" not found. Obtain a valid run ID from Run Actor or List Actor Runs.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to get actor run: ${error.message || error}`);
    }
  },
});
