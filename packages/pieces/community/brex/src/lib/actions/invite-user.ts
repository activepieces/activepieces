import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { apId } from '@activepieces/shared';
import { brexAuth } from '../../';
import { brexCommon, BrexUser } from '../common';

export const inviteUser = createAction({
  auth: brexAuth,
  name: 'invite_user',
  displayName: 'Invite User',
  description: 'Invite a new employee to your Brex account.',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: "The new user's first name.",
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: "The new user's last name.",
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description:
        'The work email address to send the invitation to. The user uses this email to activate their account.',
      required: true,
    }),
  },
  async run(context) {
    const { first_name, last_name, email } = context.propsValue;
    const response = await brexCommon.apiCall<BrexUser>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/users',
      idempotencyKey: apId(),
      body: {
        first_name,
        last_name,
        email,
      },
    });
    return brexCommon.flattenUser(response.body);
  },
});
