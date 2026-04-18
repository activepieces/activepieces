import { createAction, Property } from '@activepieces/pieces-framework';
import { mixmaxAuth } from '../..';
import { mixmaxGetRequest } from '../common';

export const findContact = createAction({
  auth: mixmaxAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Find a contact by email in Mixmax. [See the documentation](https://developer.mixmax.com/reference/contactsquery)',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The contact email to search for',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await mixmaxGetRequest(auth, '/contacts/query', {
      email: propsValue.email,
    });
    return response.body;
  },
});
