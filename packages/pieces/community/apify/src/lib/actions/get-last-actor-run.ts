import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

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

export const apifyGetLastActorRun = createAction({
  name: 'apify_get_last_actor_run',
  auth: apifyAuth,
  displayName: 'Get Last Actor Run',
  description: 'Retrieves the most recent run of an Actor, optionally filtered by status.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get the most recent run of an Actor by its actor ID, optionally restricted to a status (e.g. SUCCEEDED). Use this when you have the actor ID but not a run ID — for example to find the run to poll with Get Actor Run or to read results from. Use Get Actor Last Run Dataset Items to jump straight to that run\'s results. Resolve the actor ID with Find Actor or List Actors. Read-only and idempotent.',
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
      description: 'Optionally restrict to the last run with this status.',
      required: false,
      options: { options: RUN_STATUS_OPTIONS },
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { actorId, status } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const run = await client
        .actor(actorId)
        .lastRun({ status: status ? (status as any) : undefined })
        .get();

      if (!run) {
        throw new Error(
          `No matching run found for actor "${actorId}".`
        );
      }
      return run;
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied reading runs for actor "${actorId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Actor "${actorId}" not found, or it has no runs. Resolve the actor ID with Find Actor or List Actors.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to get last actor run: ${error.message || error}`);
    }
  },
});
