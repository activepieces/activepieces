import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const findUserByName = createAction({
  name: 'findUserByName',
  displayName: 'Find User by Name',
  description: 'Retrieve user profile for support or chatbot flow segmentation.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the user to search for',
      required: true
    })
  },
  async run({ auth, propsValue }) {
    const { name } = propsValue;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.manychat.com/fb/subscriber/findByName`,
      queryParams: {
        name: name
      },
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${auth}`
      }
    });

    return response.body;
  },
});
