import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { capsuleCrmProps } from '../common/props';

export const findContactAction = createAction({
  auth: capsuleCrmAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Find a person or organisation by email or search term.',
  props: {
    contact_id: capsuleCrmProps.contact_id(false),
    search_term: Property.ShortText({
      displayName: 'Email or Search Term',
      description:
        'The email address or a generic term (like a name) to search for. (Used if Contact ID is not selected).',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { contact_id, search_term } = propsValue;

    if (contact_id) {
      const contact = await capsuleCrmClient.getContact(
        auth,
        contact_id as number
      );
      return contact ? [contact] : [];
    }

    if (search_term) {
      const contacts = await capsuleCrmClient.searchContacts(auth, search_term);
      return contacts;
    }

    throw new Error('One of Contact ID or Email/Search Term must be provided.');
  },
});
