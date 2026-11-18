import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateUserOutputSchema } from '../../../output-schemas';

export const createUserAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_create_user',
  outputSchema: mattermostCreateUserOutputSchema,
  displayName: 'Create User',
  description: 'Creates a user account that signs in with email and password.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a real user account that signs in with email and password. Needs a connection allowed to create users (open sign-up or a system admin). Not idempotent: a taken email or username fails.',
    idempotent: false,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the new user; must not be in use.',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Unique username: lowercase letters, numbers, ".", "-" and "_", starting with a letter.',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Password for email sign-in; must meet the server\'s password rules.',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the user.',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the user.',
      required: false,
    }),
    nickname: Property.ShortText({
      displayName: 'Nickname',
      description: 'Nickname shown next to the username.',
      required: false,
    }),
  },
  async run(context) {
    const { email, username, password, firstName, lastName, nickname } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/users',
      redactBodyInErrors: true,
      body: {
        email,
        username,
        password,
        first_name: firstName,
        last_name: lastName,
        nickname,
      },
    });
  },
});
