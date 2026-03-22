import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth, LOOPS_BASE_URL } from '../auth';

export const findContact = createAction({
  name: 'find_contact',
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

    const response = await httpClient.sendRequest<unknown[]>({
      method: HttpMethod.GET,
      url: `${LOOPS_BASE_URL}/contacts/find?${params.toString()}`,
      headers: {
        Authorization: `Bearer ${context.auth as string}`,
        Accept: 'application/json',
      },
    });

    const data = response.body;

    return {
      contacts: data,
      count: Array.isArray(data) ? data.length : 0,
    };
  },
});
