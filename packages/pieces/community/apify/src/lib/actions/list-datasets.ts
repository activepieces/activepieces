import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';
import { listDatasetsActionOutputSchema } from '../output-schemas';

export const apifyListDatasets = createAction({
  name: 'apify_list_datasets',
  auth: apifyAuth,
  displayName: 'List Datasets',
  description: 'Lists the datasets in the authenticated account.',
  audience: 'ai',
  outputSchema: listDatasetsActionOutputSchema,
  aiMetadata: {
    description:
      'List the account\'s datasets (id, name, itemCount), newest first, so you can resolve a dataset ID without a dropdown. Use this to find the dataset to read with Get Dataset Items. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of datasets to return. Default 50.',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of datasets to skip at the start. Default 0.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { limit, offset } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const response = await client.datasets().list({
        desc: true,
        limit: limit ?? 50,
        offset: offset ?? 0,
      });

      const datasets = response.items.map((item) => ({
        id: item.id,
        name: item.name,
        title: item.title,
        itemCount: item.itemCount,
        createdAt: item.createdAt,
        modifiedAt: item.modifiedAt,
      }));

      return {
        datasets,
        count: datasets.length,
        total: response.total,
      };
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error('Permission denied listing datasets.');
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to list datasets: ${error.message || error}`);
    }
  },
});
