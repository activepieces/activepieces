import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../';
import { makeRequest } from '../common/client';

export const updateRecordAction = createAction({
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Update an existing record in Attio',
  auth: attioAuth,
  props: {
    object_type: Property.ShortText({
      displayName: 'Object Type',
      description: 'The type of record to update (e.g., person, company, deal)',
      required: true,
    }),
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to update',
      required: true,
    }),
    attributes: Property.Object({
      displayName: 'Attributes',
      description: 'The attributes to update. Use key:value format',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { object_type, record_id, attributes } = propsValue;

    const response = await makeRequest(
      auth,
      HttpMethod.PATCH,
      `/objects/${object_type}/records/${record_id}`,
      {
        attributes: attributes
      }
    );

    return response;
  },
});
