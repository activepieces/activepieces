import { createAction } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../index';
import { objectTypeDropdown, objectFields } from '../common/props';
import { FireberryClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { validateRequiredFields, validateApiResponse } from '../common/validate';

function isCustomObject(objectType: string) {
  return objectType.startsWith('custom_');
}

export const createRecordAction = createAction({
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Create a new record in a specified object type (standard or custom).',
  auth: fireberryAuth,
  props: {
    objectType: objectTypeDropdown,
    fields: objectFields,
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth as string);
    const { objectType, fields } = propsValue;
    const fieldsObj = typeof fields === 'string' ? JSON.parse(fields) : fields;
    validateRequiredFields(fieldsObj, Object.keys(fieldsObj));
    let resourceUri = '';
    let body: any = {};
    if (isCustomObject(objectType)) {
      resourceUri = '/custom-object-records/';
      body = { object: objectType, ...fieldsObj };
    } else {
      resourceUri = `/${objectType}/`;
      body = fieldsObj;
    }
    const response = await client.request({
      method: HttpMethod.POST,
      resourceUri,
      body,
    });
    validateApiResponse(response, ['id']);
    return response;
  },
}); 