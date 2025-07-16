import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../index';
import { objectTypeDropdown, objectFields } from '../common/props';
import { FireberryClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { validateBatchSize, validateRequiredFields, validateIds, checkPartialFailures } from '../common/validate';

function isCustomObject(objectType: string) {
  return objectType.startsWith('custom_');
}

const MAX_BATCH_SIZE = 100;

export const batchUpdateAction = createAction({
  name: 'batch_update',
  displayName: 'Batch Update Records',
  description: 'Update multiple records in a specified object type (standard or custom).',
  auth: fireberryAuth,
  props: {
    objectType: objectTypeDropdown,
    records: Property.Json({
      displayName: 'Records',
      description: 'Array of objects to update. Each object must include its ID and match the selected object type\'s fields.',
      required: true,
      defaultValue: [
        { id: 'record_id', /* example: field1: "value", field2: 123 */ }
      ],
    }),
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth as string);
    const { objectType, records } = propsValue;
    if (!Array.isArray(records)) {
      throw new Error('Records must be an array of objects');
    }
    validateBatchSize(records, MAX_BATCH_SIZE);
    validateIds(records, 'id');
    for (const rec of records) {
      if (typeof rec !== 'object' || rec === null) {
        throw new Error('Each record must be an object');
      }
      validateRequiredFields(rec as Record<string, any>, Object.keys(rec as object));
    }
    let resourceUri = '';
    let body: any = {};
    if (isCustomObject(objectType)) {
      resourceUri = '/batch/custom-object-records/';
      body = { object: objectType, records };
    } else {
      resourceUri = `/batch/${objectType}/`;
      body = { records };
    }
    const response = await client.request({
      method: HttpMethod.PUT,
      resourceUri,
      body,
    });
    checkPartialFailures(response);
    return response;
  },
}); 