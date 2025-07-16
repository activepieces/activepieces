import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../index';
import { objectTypeDropdown } from '../common/props';
import { FireberryClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { validateBatchSize, checkPartialFailures } from '../common/validate';

function isCustomObject(objectType: string) {
  return objectType.startsWith('custom_');
}

const MAX_BATCH_SIZE = 100;

export const batchDeleteAction = createAction({
  name: 'batch_delete',
  displayName: 'Batch Delete Records',
  description: 'Delete multiple records in a specified object type (standard or custom).',
  auth: fireberryAuth,
  props: {
    objectType: objectTypeDropdown,
    ids: Property.Json({
      displayName: 'IDs',
      description: 'Array of record IDs to delete.',
      required: true,
      defaultValue: ["id1", "id2"],
    }),
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth as string);
    const { objectType, ids } = propsValue;
    if (!Array.isArray(ids)) {
      throw new Error('IDs must be an array of strings');
    }
    validateBatchSize(ids, MAX_BATCH_SIZE);
    for (const id of ids) {
      if (!id || typeof id !== 'string') throw new Error('Each record must include a valid ID');
    }
    let resourceUri = '';
    let body: any = {};
    if (isCustomObject(objectType)) {
      resourceUri = '/batch/custom-object-records/';
      body = { object: objectType, ids };
    } else {
      resourceUri = `/batch/${objectType}/`;
      body = { ids };
    }
    const response = await client.request({
      method: HttpMethod.DELETE,
      resourceUri,
      body,
    });
    checkPartialFailures(response);
    return response;
  },
}); 