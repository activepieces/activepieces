import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';

export const findContactAction = createAction({
  auth: capsuleCrmAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Find a person or organisation by email or search term.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the person to find.',
      required: false,
    }),
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description:
        'A generic search term to find a contact by name, phone, etc. (Used if Email is not provided).',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { email, search_term } = propsValue;

    if (!email && !search_term) {
      throw new Error('Either Email or Search Term must be provided.');
    }

    const contacts = await capsuleCrmClient.findContact(auth, {
      email: email,
      searchTerm: search_term,
    });

    return contacts;
  },
});
