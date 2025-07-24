import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const findContactByEmail = createAction({
  name: 'findContactByEmail',
  displayName: 'Find Contact by Email',
  description: 'Retrieve contact details by email address in systeme.io.',
  props: {
    email: Property.ShortText({ displayName: 'Email', required: true }),
  },
  async run(context) {
    const email = context.propsValue['email'];
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.systeme.io/api/contacts?email=${encodeURIComponent(email)}`,
      headers: {
        'X-API-Key': String(context.auth),
      },
    });
    const items = response.body.items || [];
    if (items.length === 0) {
      return { message: 'No contact found with the provided email.', found: false };
    }
    return items[0];
  },
}); 