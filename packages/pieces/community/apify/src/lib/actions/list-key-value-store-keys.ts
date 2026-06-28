import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

export const apifyListKeyValueStoreKeys = createAction({
  name: 'apify_list_key_value_store_keys',
  auth: apifyAuth,
  displayName: 'List Key-Value Store Keys',
  description: 'Lists the record keys in an Apify key-value store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the record keys (and sizes) in a key-value store by its store ID, optionally filtered by key prefix. This is the prerequisite to reading a record: use it to discover which key to pass to Get Key-Value Store Record. Obtain the store ID from List Key-Value Stores. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    storeId: Property.ShortText({
      displayName: 'Key-Value Store ID',
      description:
        'The ID of the key-value store. Obtain it from List Key-Value Stores or a run\'s defaultKeyValueStoreId.',
      required: true,
    }),
    prefix: Property.ShortText({
      displayName: 'Key Prefix',
      description: 'Optional. Only return keys starting with this prefix.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of keys to return.',
      required: false,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { storeId, prefix, limit } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const response = await client.keyValueStore(storeId).listKeys({
        prefix: prefix || undefined,
        limit: limit ?? undefined,
      });

      return {
        keys: response.items,
        count: response.count,
        isTruncated: response.isTruncated,
        nextExclusiveStartKey: response.nextExclusiveStartKey,
        storeId,
      };
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied listing keys for store "${storeId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Key-value store "${storeId}" not found. Resolve the store ID via List Key-Value Stores.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to list key-value store keys: ${error.message || error}`);
    }
  },
});
