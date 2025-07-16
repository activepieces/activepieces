import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../index';
import { objectTypeDropdown, objectFields } from '../common/props';
import { FireberryClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { validateRequiredFields, validateApiResponse } from '../common/validate';

function isCustomObject(objectType: string) {
  return objectType.startsWith('custom_');
}

export const updateRecordAction = createAction({
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Update fields of an existing record in Fireberry (standard or custom object).',
  auth: fireberryAuth,
  props: {
    objectType: objectTypeDropdown,
    recordId: Property.ShortText({
      displayName: 'Record ID',
      required: true,
      description: 'The unique identifier of the record to update.',
    }),
    fields: objectFields,
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth as string);
    const { objectType, recordId, fields } = propsValue;
    if (!recordId) throw new Error('Record ID is required');
    const fieldsObj = typeof fields === 'string' ? JSON.parse(fields) : fields;
    validateRequiredFields(fieldsObj, Object.keys(fieldsObj));
    let resourceUri = '';
    let body: any = {};
    if (isCustomObject(objectType)) {
      resourceUri = `/custom-object-records/${recordId}/`;
      body = { object: objectType, ...fieldsObj };
    } else {
      resourceUri = `/${objectType}/${recordId}/`;
      body = fieldsObj;
    }
    const response = await client.request({
      method: HttpMethod.PUT,
      resourceUri,
      body,
    });
    validateApiResponse(response, ['id']);
    return response;
  },
}); 