import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../index';
import { objectTypeDropdown, objectFields } from '../common/props';
import { FireberryClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { validateBatchSize, validateRequiredFields, checkPartialFailures } from '../common/validate';

function isCustomObject(objectType: string) {
  return objectType.startsWith('custom_');
}

const MAX_BATCH_SIZE = 100;

export const batchCreateAction = createAction({
  name: 'batch_create',
  displayName: 'Batch Create Records',
  description: 'Create multiple records in a specified object type (standard or custom).',
  auth: fireberryAuth,
  props: {
    objectType: objectTypeDropdown,
    records: Property.Array({
      displayName: 'Records',
      required: true,
      description: 'Array of records to create',
      item: objectFields,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth as string);
    const { objectType, records } = propsValue;
    validateBatchSize(records, MAX_BATCH_SIZE);
    for (const rec of records) {
      validateRequiredFields(rec, Object.keys(rec));
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
      method: HttpMethod.POST,
      resourceUri,
      body,
    });
    checkPartialFailures(response);
    return response;
  },
}); 