import {
  AppConnectionType,
  PieceAuth,
  Property,
  tryCatch,
} from '@activepieces/pieces-framework';

import { pastebinApi } from './common/api';

import type { PastebinAuthValue } from './common/types';

const markdownDescription = `
1. Sign in to pastebin.com (create a free account if needed).
2. Open **https://pastebin.com/doc_api** and copy your Unique Developer API Key.
3. Add your username and password only to make private pastes, use folders, or read your private pastes.
`;

export const pastebinAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdownDescription,
  props: {
    token: PieceAuth.SecretText({
      displayName: 'Developer Key',
      description: 'Shown on pastebin.com/doc_api once you are signed in.',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Only needed for private pastes and folders.',
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Only needed with a username.',
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
