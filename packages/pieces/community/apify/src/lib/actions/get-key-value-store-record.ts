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

    try {
      const record = await client.keyValueStore(store).getRecord(recordKey);

      if (!record) {
        throw new Error(`Record with key "${recordKey}" not found`);
      }

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
      if (error.message.includes('not found')) {
        throw new Error(`Record "${recordKey}" not found in store`);
      }
      throw new Error(`Failed to get key-value store item: ${error.message}`);
    }
  }
});
