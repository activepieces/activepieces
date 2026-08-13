import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';
import { listActorRunsActionOutputSchema } from '../output-schemas';

const RUN_STATUS_OPTIONS = [
  { label: 'Ready', value: 'READY' },
  { label: 'Running', value: 'RUNNING' },
  { label: 'Succeeded', value: 'SUCCEEDED' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Timing Out', value: 'TIMING-OUT' },
  { label: 'Timed Out', value: 'TIMED-OUT' },
  { label: 'Aborting', value: 'ABORTING' },
  { label: 'Aborted', value: 'ABORTED' },
];

export const apifyListActorRuns = createAction({
  name: 'apify_list_actor_runs',
  auth: apifyAuth,
  displayName: 'List Actor Runs',
  description: 'Lists the run history of a single Actor.',
  audience: 'ai',
  outputSchema: listActorRunsActionOutputSchema,
  aiMetadata: {
    description:
      'List the run history of one Actor by its actor ID, newest first, optionally filtered by status. Use this to recover a lost run ID or review past runs of a specific actor; use List Runs for runs across the whole account, or Get Last Actor Run for just the most recent. Resolve the actor ID with Find Actor or List Actors. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    actorId: Property.ShortText({
      displayName: 'Actor ID',
      description:
        'The ID (or "username~actor-name") of the Actor. Obtain it from Find Actor or List Actors.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Optionally filter runs by status.',
      required: false,
      options: { options: RUN_STATUS_OPTIONS },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of runs to return. Default 50.',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of runs to skip at the start. Default 0.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { actorId, status, limit, offset } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const response = await client.actor(actorId).runs().list({
        status: status ? (status as any) : undefined,
        desc: true,
        limit: limit ?? 50,
        offset: offset ?? 0,
      });

      return {
        runs: response.items,
        count: response.items.length,
        total: response.total,
        actorId,
      };
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied listing runs for actor "${actorId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Actor "${actorId}" not found. Resolve the actor ID with Find Actor or List Actors.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to list actor runs: ${error.message || error}`);
    }
  },
});
