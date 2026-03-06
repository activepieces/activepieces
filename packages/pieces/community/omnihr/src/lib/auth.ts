import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { getAccessToken } from './common/client';

export const omnihrAuth = PieceAuth.CustomAuth({
  description: 'Enter your OmniHR credentials to authenticate:',
  required: true,
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Your OmniHR email address',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Your OmniHR password',
      required: true,
    }),
    origin: Property.ShortText({
      displayName: 'Origin',
      description: 'Your OmniHR origin URL',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await getAccessToken({ props: auth });
      return {
        valid: true,
      };
    } catch (error: unknown) {
      return {
        valid: false,
        error: `Authentication failed: ${
          (error as Error).message || 'Invalid credentials'
        }`,
      };
    }
  },
});
