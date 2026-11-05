import {
  AppConnectionType,
  PieceAuth,
  Property,
  tryCatch,
} from '@activepieces/pieces-framework';

import { pastebinApi } from './common/api';

import type { PastebinAuthValue } from './common/types';

const markdownDescription = `
Here are the simple steps to get your credentials:

1. Make an account, If you don't have one yet.
2. Go to **https://pastebin.com/doc_api**.
3. Copy your unique Developer API Key and paste it.
4. Provide your username and password if you want to create **private pastes** under your account.
`;

export const pastebinAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdownDescription,
  props: {
    token: PieceAuth.SecretText({
      displayName: 'Developer Key',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    const connection: PastebinAuthValue = {
      type: AppConnectionType.CUSTOM_AUTH,
      props: auth,
    };
    if (Boolean(auth.username) !== Boolean(auth.password)) {
      return {
        valid: false,
        error: 'Enter both username and password, or leave both empty.',
      };
    }
    const { data: isValid, error } = await tryCatch(() =>
      pastebinApi.verifyCredentials({ auth: connection })
    );
    if (error) {
      return {
        valid: false,
        error:
          'Could not reach Pastebin to check the connection. Please try again.',
      };
    }
    if (isValid) {
      return { valid: true };
    }
    return {
      valid: false,
      error: auth.username
        ? 'Invalid developer key, username or password.'
        : 'Invalid developer key.',
    };
  },
});
