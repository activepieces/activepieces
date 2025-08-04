import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { AtpAgent } from '@atproto/api';

export interface BlueSkyAuthType {
  pdsHost?: string;
  identifier: string;
  password: string;
}

const description = `
To authenticate with Bluesky:

1. **PDS Host**: The Personal Data Server host. Leave empty to use the default Bluesky network (https://bsky.social).
2. **Identifier**: Your Bluesky handle (e.g., yourhandle.bsky.social) or email address.
3. **Password**: Your Bluesky account password or app password.

For enhanced security, consider using an app password from your Bluesky account settings.
`;

export const blueskyAuth = PieceAuth.CustomAuth({
  description: description,
  required: true,
  props: {
    pdsHost: Property.ShortText({
      displayName: 'PDS Host',
      description: 'The Personal Data Server host. Leave empty for default Bluesky network (https://bsky.social)',
      required: false,
      defaultValue: 'https://bsky.social',
    }),
    identifier: Property.ShortText({
      displayName: 'Identifier',
      description: 'Your Bluesky handle or email address',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Your Bluesky account password or app password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const agent = new AtpAgent({
        service: auth.pdsHost || 'https://bsky.social',
      });

      await agent.login({
        identifier: auth.identifier,
        password: auth.password,
      });

      return {
        valid: true,
      };
    } catch (error: any) {
      if (error.message?.includes('Invalid identifier or password')) {
        return {
          valid: false,
          error: 'Invalid credentials. Please check your identifier and password.',
        };
      } else if (error.message?.includes('Invalid request')) {
        return {
          valid: false,
          error: 'Invalid request. Please check your identifier format.',
        };
      } else {
        return {
          valid: false,
          error: `Authentication failed: ${error.message || 'Unknown error'}`,
        };
      }
    }
  },
});
