import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';
import { getActorLastRunDatasetItemsActionOutputSchema } from '../output-schemas';

export const apifyGetActorLastRunDatasetItems = createAction({
  name: 'apify_get_actor_last_run_dataset_items',
  auth: apifyAuth,
  displayName: 'Get Actor Last Run Dataset Items',
  description: 'Retrieves the dataset items of an Actor\'s most recent run by actor ID.',
  audience: 'ai',
  outputSchema: getActorLastRunDatasetItemsActionOutputSchema,
  aiMetadata: {
    description:
      'Read the result rows of an Actor\'s most recent run directly by actor ID, with optional offset/limit paging. Use this one-shot shortcut to get "the latest results of this actor" without chaining run/dataset IDs. Optionally restrict to a status (e.g. SUCCEEDED) so you only read a completed run. Resolve the actor ID with Find Actor or List Actors. Read-only and idempotent.',
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
      description:
        'Optionally restrict to the last run with this status (e.g. SUCCEEDED).',
      required: false,
      options: {
        options: [
          { label: 'Succeeded', value: 'SUCCEEDED' },
          { label: 'Failed', value: 'FAILED' },
          { label: 'Running', value: 'RUNNING' },
          { label: 'Aborted', value: 'ABORTED' },
          { label: 'Timed Out', value: 'TIMED-OUT' },
        ],
      },
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of items to skip at the start. Default 0.',
      required: false,
      defaultValue: 0,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of items to return. Must be greater than 0.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { actorId, status, offset, limit } = context.propsValue;

    if (offset != null && offset < 0) {
      throw new Error('Offset must be greater than or equal to 0.');
    }
    if (limit != null && limit <= 0) {
      throw new Error('Limit must be greater than 0.');
    }

    const client = createApifyClient(apifyToken);

    try {
      const response = await client
        .actor(actorId)
        .lastRun({ status: status ? (status as any) : undefined })
        .dataset()
        .listItems({ limit, offset });

      return {
        items: response.items,
        count: response.count,
        total: response.total,
        offset: response.offset,
        limit: response.limit,
        actorId,
      };
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(
          `Permission denied reading the last run dataset for actor "${actorId}".`
        );
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Actor "${actorId}" not found or it has no matching run. Resolve the actor ID with Find Actor or List Actors.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(
        `Failed to read actor last run dataset items: ${error.message || error}`
      );
    }
  },
});
