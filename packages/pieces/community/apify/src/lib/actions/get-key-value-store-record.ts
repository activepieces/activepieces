import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import {
  createApifyClient,
  createDropdownOptions,
  getFileExtension,
  isBinaryContentType,
  listRecords,
  listStores
} from '../common';

export const getKeyValueStoreRecord = createAction({
  name: 'getKeyValueStoreRecord',
  auth: apifyAuth,
  displayName: 'Get Key-Value Store Record',
  description: 'Retrieves a value stored in the key-value store under a specific key',
  audience: 'both',
  aiMetadata: { description: 'Fetches a single record from an Apify key-value store by store ID and record key, returning JSON/text values inline or binary values as a file reference. Use this to read named outputs an actor saved (e.g. screenshots, structured results, or status keys) rather than dataset rows. Read-only and idempotent; errors if the key does not exist.', idempotent: true },
  props: {
    store: Property.Dropdown({
      auth: apifyAuth,
      required: true,
      refreshers: ['auth'],
      displayName: 'Key-Value Store ID',
      description: 'The ID of the Key-Value Store.',
      options: async (props) => {
        return createDropdownOptions(props['auth'], listStores);
      }
    }),
    recordKey: Property.Dropdown({
      auth: apifyAuth,
      required: true,
      refreshers: ['auth', 'store'],
      displayName: 'Key-Value Store Record Key',
      description: 'The key of the record to be retrieved.',
      options: async (props) => {
        if (!props['auth'] || !props['store']) {
          return {
            disabled: true,
            options: [],
          };
        }

        const storeId = props['store'] as string;
        return createDropdownOptions(props['auth'], (apiKey) => listRecords(apiKey, storeId));
      }
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { store, recordKey } = context.propsValue;

    const client = createApifyClient(apifyToken);

    const record = await client.keyValueStore(store).getRecord(recordKey);

    if (!record) {
      throw new Error(`Record with key "${recordKey}" not found in store "${store}"`);
    }

    try {
      const isBinary = isBinaryContentType(record.contentType!);
      const isJson = record.contentType?.includes('application/json');

      if (isJson) {
        return {
          key: recordKey,
          value: record.value,
          contentType: record.contentType,
          dataType: 'json'
        };
      }

      if (isBinary && Buffer.isBuffer(record.value)) {
        const fileExtension = getFileExtension(record.contentType!);
        const fileName = recordKey + fileExtension;

        const fileReference = await context.files.write({
          fileName: fileName,
          data: record.value
        });

        return {
          key: recordKey,
          file: fileReference,
          fileName: fileName,
          contentType: record.contentType,
          size: record.value.length,
          dataType: 'file'
        };
      }

      return {
        key: recordKey,
        value: record.value,
        contentType: record.contentType,
        dataType: 'text'
      };
    } catch (error: any) {
      throw new Error(`Failed to process key-value store record: ${error.message}`);
    }
  }
});
