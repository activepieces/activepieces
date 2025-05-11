import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { makeRequest } from '../common/client';

export const createRecordAction = createAction({
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Create a new record in Attio (e.g., person, company, or deal)',
  auth: attioAuth,
  props: {
    object_type: Property.ShortText({
      displayName: 'Object Type',
      description: 'The type of record to create (e.g., person, company, deal)',
      required: true,
    }),
    attributes: Property.Object({
      displayName: 'Attributes',
      description: 'The attributes of the record. Use key:value format',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { object_type, attributes } = propsValue;

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      `/objects/${object_type}/records`,
      {
        attributes: attributes
      }
    );

    return response;
  },
});
