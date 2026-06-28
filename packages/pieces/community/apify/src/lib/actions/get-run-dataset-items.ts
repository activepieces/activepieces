import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

export const apifyGetRunDatasetItems = createAction({
  name: 'apify_get_run_dataset_items',
  auth: apifyAuth,
  displayName: 'Get Run Dataset Items',
  description: 'Retrieves the dataset items of an Actor run directly by run ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read the result rows of a run\'s default dataset directly by run ID, with optional offset/limit paging. Use this when you have a run ID (from Run Actor) but not a dataset ID — it saves a Get Actor Run call. If you already have the dataset ID, use Get Dataset Items. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    runId: Property.ShortText({
      displayName: 'Run ID',
      description:
        'The ID of the run whose dataset items to read. Obtain it from Run Actor, List Actor Runs, or Get Last Actor Run.',
      required: true,
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
    const { runId, offset, limit } = context.propsValue;

    if (offset != null && offset < 0) {
      throw new Error('Offset must be greater than or equal to 0.');
    }
    if (limit != null && limit <= 0) {
      throw new Error('Limit must be greater than 0.');
    }

    const client = createApifyClient(apifyToken);

    try {
      const response = await client.run(runId).dataset().listItems({
        limit,
        offset,
      });

      return {
        items: response.items,
        count: response.count,
        total: response.total,
        offset: response.offset,
        limit: response.limit,
        runId,
      };
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied reading dataset for run "${runId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Run "${runId}" or its dataset not found. Obtain a valid run ID from Run Actor or List Actor Runs.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to read run dataset items: ${error.message || error}`);
    }
  },
});
