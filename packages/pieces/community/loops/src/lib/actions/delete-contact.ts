import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth, LOOPS_BASE_URL } from '../auth';

export const deleteContact = createAction({
  name: 'delete_contact',
  displayName: 'Delete Contact',
  description:
    'Permanently deletes a contact from Loops by their email address or user ID.',
  auth: loopsAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact to delete.',
      required: false,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'Your internal user ID of the contact to delete.',
      required: false,
    }),
  },
  async run(context) {
    const { email, userId } = context.propsValue;

    if (!email && !userId) {
      throw new Error('At least one of "Email" or "User ID" must be provided.');
    }

    const body: Record<string, string> = {};
    if (email) body['email'] = email;
    if (userId) body['userId'] = userId;

    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.DELETE,
      url: `${LOOPS_BASE_URL}/contacts/delete`,
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    });

    return response.body;
  },
});
