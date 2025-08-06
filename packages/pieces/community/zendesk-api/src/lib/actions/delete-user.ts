import {
  Property,
  createAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { zendeskApiAuth } from '../..';

export const deleteUser = createAction({
  auth: zendeskApiAuth,
  name: 'delete_user',
  displayName: 'Delete User',
  description: 'Remove a user and associated records from the account',
  props: {
    user_id: Property.Number({
      displayName: 'User ID',
      description: 'The ID of the user to delete',
      required: true,
    }),
    confirmation: Property.Checkbox({
      displayName: 'I understand this action is irreversible',
      description: 'Confirm that you understand deleted users are not recoverable',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { email, token, subdomain } = auth as {
      email: string;
      token: string;
      subdomain: string;
    };

    // Safety check for confirmation
    if (!propsValue.confirmation) {
      throw new Error('You must confirm that you understand this action is irreversible');
    }

    const response = await httpClient.sendRequest({
      url: `https://${subdomain}.zendesk.com/api/v2/users/${propsValue.user_id}.json`,
      method: HttpMethod.DELETE,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${email}/token:${token}`).toString('base64')}`,
      },
    });

    return response.body;
  },
});