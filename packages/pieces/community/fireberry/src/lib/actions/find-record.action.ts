import { createAction } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../index';
import { objectTypeDropdown, objectFields } from '../common/props';
import { FireberryClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { validateRequiredFields, validateApiResponse } from '../common/validate';

function isCustomObject(objectType: string) {
  return objectType.startsWith('custom_');
}

export const findRecordAction = createAction({
  name: 'find_record',
  displayName: 'Find Record',
  description: 'Search for a specific record by field values (standard or custom object).',
  auth: fireberryAuth,
  props: {
    objectType: objectTypeDropdown,
    searchFields: objectFields,
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth as string);
    const { objectType, searchFields } = propsValue;
    const searchFieldsObj = typeof searchFields === 'string' ? JSON.parse(searchFields) : searchFields;
    validateRequiredFields(searchFieldsObj, Object.keys(searchFieldsObj));
    let resourceUri = '';
    let queryParams: Record<string, any> = {};
    if (isCustomObject(objectType)) {
      resourceUri = '/custom-object-records/';
      queryParams = { object: objectType, ...searchFieldsObj };
    } else {
      resourceUri = `/${objectType}/`;
      queryParams = searchFieldsObj;
    }
    const response = await client.request({
      method: HttpMethod.GET,
      resourceUri,
      queryParams,
    });
    validateApiResponse(response, ['results']);
    return response;
  },
}); 