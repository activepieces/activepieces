import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../..';

export const updateRecord = createAction({
  auth: attioAuth,
  name: 'updateRecord',
  displayName: 'Update Record',
  description: 'Modify details of an existing record in Attio. For multiselect attributes, values will be appended to existing ones.',
  props: {
    object: Property.ShortText({
      displayName: 'Object',
      description: 'The UUID or slug identifying the object the record belongs to (e.g., people, companies)',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The UUID of the record to update',
      required: true,
    }),
    values: Property.Object({
      displayName: 'Values',
      description: 'An object with attribute API slugs or IDs as keys and their values. For multiselect attributes, values will be appended to existing ones.',
      required: true,
    }),
  },
  async run(context) {
    const { object, recordId, values } = context.propsValue;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `https://api.attio.com/v2/objects/${object}/records/${recordId}`,
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        data: {
          values,
        },
      },
    });

    return response.body;
  },
});
