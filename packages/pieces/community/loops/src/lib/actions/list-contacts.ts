import { createAction, Property } from '@activepieces/pieces-framework';
import { loopsAuth, LOOPS_BASE_URL, loopsAuthHeaders } from '../auth';

export const listContacts = createAction({
  name: 'list_contacts',
  displayName: 'Find Contact',
  description:
    'Finds a contact in Loops by their email address or user ID.',
  auth: loopsAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Look up a contact by their email address.',
      required: false,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'Look up a contact by your internal user ID.',
      required: false,
    }),
  },
  async run(context) {
    const { email, userId } = context.propsValue;

    if (!email && !userId) {
      throw new Error('At least one of "Email" or "User ID" must be provided.');
    }

    const params = new URLSearchParams();
    if (email) params.set('email', email);
    if (userId) params.set('userId', userId);

    const response = await fetch(
      `${LOOPS_BASE_URL}/contacts/find?${params.toString()}`,
      {
        method: 'GET',
        headers: loopsAuthHeaders(context.auth as string),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Loops API error ${response.status}: ${JSON.stringify(data)}`
      );
    }

    // The API returns an array of matching contacts
    return {
      contacts: data,
      count: Array.isArray(data) ? data.length : 0,
    };
  },
});
