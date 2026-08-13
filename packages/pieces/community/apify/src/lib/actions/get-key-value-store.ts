import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';
import { getKeyValueStoreActionOutputSchema } from '../output-schemas';

export const apifyGetKeyValueStore = createAction({
  name: 'apify_get_key_value_store',
  auth: apifyAuth,
  displayName: 'Get Key-Value Store',
  description: 'Retrieves metadata for an Apify key-value store by store ID.',
  audience: 'ai',
  outputSchema: getKeyValueStoreActionOutputSchema,
  aiMetadata: {
    description:
      'Get metadata for one key-value store by its store ID (name, stats) — distinct from reading its records. Use this to inspect a store before listing its keys (List Key-Value Store Keys) or reading a record (Get Key-Value Store Record). Obtain the store ID from List Key-Value Stores. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    storeId: Property.ShortText({
      displayName: 'Key-Value Store ID',
      description:
        'The ID of the key-value store. Obtain it from List Key-Value Stores or a run\'s defaultKeyValueStoreId.',
      required: true,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { storeId } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const store = await client.keyValueStore(storeId).get();
      if (!store) {
        throw new Error(
          `Key-value store "${storeId}" not found. Resolve the store ID via List Key-Value Stores.`
        );
      }
      return store;
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied reading store "${storeId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Key-value store "${storeId}" not found. Resolve the store ID via List Key-Value Stores.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to get key-value store: ${error.message || error}`);
    }
  },
});
