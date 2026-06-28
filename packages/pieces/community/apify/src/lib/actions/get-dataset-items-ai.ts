import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

export const apifyGetDatasetItems = createAction({
  name: 'apify_get_dataset_items',
  auth: apifyAuth,
  displayName: 'Get Dataset Items',
  description: 'Retrieves stored result items from an Apify dataset by dataset ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read the stored result rows of an Apify dataset by its dataset ID, with optional offset/limit paging. Obtain the dataset ID from a run\'s output (defaultDatasetId, via Get Actor Run) or from List Datasets. Use Get Run Dataset Items if you have a runId instead of a datasetId. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    datasetId: Property.ShortText({
      displayName: 'Dataset ID',
      description:
        'The ID of the dataset to read. Obtain it from a run\'s defaultDatasetId (Get Actor Run) or from List Datasets.',
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
    const { datasetId, offset, limit } = context.propsValue;

    if (offset != null && offset < 0) {
      throw new Error('Offset must be greater than or equal to 0.');
    }
    if (limit != null && limit <= 0) {
      throw new Error('Limit must be greater than 0.');
    }

    const client = createApifyClient(apifyToken);

    try {
      const response = await client.dataset(datasetId).listItems({
        limit,
        offset,
      });

      return {
        items: response.items,
        count: response.count,
        total: response.total,
        offset: response.offset,
        limit: response.limit,
        datasetId,
      };
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(
          `Permission denied reading dataset "${datasetId}".`
        );
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Dataset "${datasetId}" not found. Resolve the dataset ID via List Datasets or a run's defaultDatasetId.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to read dataset items: ${error.message || error}`);
    }
  },
});
