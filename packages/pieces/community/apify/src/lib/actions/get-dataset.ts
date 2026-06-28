import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

export const apifyGetDataset = createAction({
  name: 'apify_get_dataset',
  auth: apifyAuth,
  displayName: 'Get Dataset',
  description: 'Retrieves metadata for an Apify dataset by dataset ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get metadata for one dataset by its dataset ID (name, itemCount, stats) — distinct from reading its rows. Use this to check how many items a dataset holds before paging through it with Get Dataset Items. Obtain the dataset ID from List Datasets or a run\'s defaultDatasetId. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    datasetId: Property.ShortText({
      displayName: 'Dataset ID',
      description:
        'The ID of the dataset. Obtain it from List Datasets or a run\'s defaultDatasetId (Get Actor Run).',
      required: true,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { datasetId } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const dataset = await client.dataset(datasetId).get();
      if (!dataset) {
        throw new Error(
          `Dataset "${datasetId}" not found. Resolve the dataset ID via List Datasets.`
        );
      }
      return dataset;
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied reading dataset "${datasetId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Dataset "${datasetId}" not found. Resolve the dataset ID via List Datasets.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to get dataset: ${error.message || error}`);
    }
  },
});
