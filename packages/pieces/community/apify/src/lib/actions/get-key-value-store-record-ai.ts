import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import {
  createApifyClient,
  getFileExtension,
  isBinaryContentType,
} from '../common';

export const apifyGetKeyValueStoreRecord = createAction({
  name: 'apify_get_key_value_store_record',
  auth: apifyAuth,
  displayName: 'Get Key-Value Store Record',
  description: 'Retrieves a single record from an Apify key-value store by store ID and key.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetch one named record from an Apify key-value store by store ID and record key, returning JSON/text inline or binary content as a file. Use this for named outputs an Actor saved (e.g. OUTPUT, screenshots) rather than dataset rows (use Get Dataset Items for those). Resolve the store ID via List Key-Value Stores and the record key via List Key-Value Store Keys. Read-only and idempotent; errors if the key does not exist.',
    idempotent: true,
  },
  props: {
    storeId: Property.ShortText({
      displayName: 'Key-Value Store ID',
      description:
        'The ID of the key-value store. Obtain it from List Key-Value Stores or a run\'s defaultKeyValueStoreId (Get Actor Run).',
      required: true,
    }),
    recordKey: Property.ShortText({
      displayName: 'Record Key',
      description:
        'The key of the record to retrieve (e.g. "OUTPUT"). Obtain available keys from List Key-Value Store Keys.',
      required: true,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { storeId, recordKey } = context.propsValue;

    const client = createApifyClient(apifyToken);

    let record;
    try {
      record = await client.keyValueStore(storeId).getRecord(recordKey);
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied reading store "${storeId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Store "${storeId}" not found. Resolve the store ID via List Key-Value Stores.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to read store record: ${error.message || error}`);
    }

    if (!record) {
      throw new Error(
        `Record with key "${recordKey}" not found in store "${storeId}".`
      );
    }

    try {
      const isBinary = isBinaryContentType(record.contentType!);
      const isJson = record.contentType?.includes('application/json');

      if (isJson) {
        return {
          key: recordKey,
          value: record.value,
          contentType: record.contentType,
          dataType: 'json',
        };
      }

      if (isBinary && Buffer.isBuffer(record.value)) {
        const fileExtension = getFileExtension(record.contentType!);
        const fileName = recordKey + fileExtension;

        const fileReference = await context.files.write({
          fileName: fileName,
          data: record.value,
        });

        return {
          key: recordKey,
          file: fileReference,
          fileName: fileName,
          contentType: record.contentType,
          size: record.value.length,
          dataType: 'file',
        };
      }

      return {
        key: recordKey,
        value: record.value,
        contentType: record.contentType,
        dataType: 'text',
      };
    } catch (error: any) {
      throw new Error(
        `Failed to process key-value store record: ${error.message}`
      );
    }
  },
});
