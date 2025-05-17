import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';


export const findUserByCustomField = createAction({
  name: 'findUserByCustomField',
  displayName: 'Find User by Custom Field',
  description: 'Search for a user by phone number or email to personalize messaging.',
  props: {
    field: Property.StaticDropdown({
      displayName: 'System Field',
      description: 'The system field to search by',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' }
        ]
      }
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'The value to search for',
      required: true
    })
  },
  async run({ auth, propsValue }) {
    const { field, value } = propsValue;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.manychat.com/fb/subscriber/findBySystemField`,
      queryParams: {
        [field]: value
      },
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${auth}`
      }
    });

    return response.body;
  },
});
