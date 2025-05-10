import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../..';

export const createRecord = createAction({
  auth: attioAuth,
  name: 'createRecord',
  displayName: 'Create Record',
  description: 'Add a new record (e.g., person, company, or deal) to Attio.',
  props: {
    object: Property.ShortText({
      displayName: 'Object',
      description: 'The UUID or slug identifying the object the created record should belong to (e.g., people, companies)',
      required: true,
    }),
    values: Property.Object({
      displayName: 'Values',
      description: 'An object with attribute API slugs or IDs as keys and their values. For multi-select attributes, use arrays of values.',
      required: true,
    }),
  },
  async run(context) {
    const { object, values } = context.propsValue;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.attio.com/v2/objects/${object}/records`,
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
