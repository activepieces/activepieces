import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';
import { listKeyValueStoresActionOutputSchema } from '../output-schemas';

export const apifyListKeyValueStores = createAction({
  name: 'apify_list_key_value_stores',
  auth: apifyAuth,
  displayName: 'List Key-Value Stores',
  description: 'Lists the key-value stores in the authenticated account.',
  audience: 'ai',
  outputSchema: listKeyValueStoresActionOutputSchema,
  aiMetadata: {
    description:
      'List the account\'s key-value stores (id, name), newest first, so you can resolve a store ID without a dropdown. Use this to find the store to read with Get Key-Value Store Record (after listing its keys with List Key-Value Store Keys). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of stores to return. Default 50.',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of stores to skip at the start. Default 0.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { limit, offset } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const response = await client.keyValueStores().list({
        desc: true,
        limit: limit ?? 50,
        offset: offset ?? 0,
      });

      const stores = response.items.map((item) => ({
        id: item.id,
        name: item.name,
        title: item.title,
        createdAt: item.createdAt,
        modifiedAt: item.modifiedAt,
      }));

      return {
        stores,
        count: stores.length,
        total: response.total,
      };
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error('Permission denied listing key-value stores.');
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to list key-value stores: ${error.message || error}`);
    }
  },
});
