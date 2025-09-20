import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { octopusauth } from '../../index';

export const createList = createAction({
  auth: octopusauth,
  name: 'createList',
  displayName: 'Create List',
  description: 'Creates a new list.',
  props: {
    listName: Property.ShortText({
      displayName: 'List Name',
      description: 'Name for the new list',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { listName } = propsValue;
    
    const body: {
      name: string;
    } = {
      name: listName,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.emailoctopus.com/lists',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
      body,
    });

    return response.body;
  },
});