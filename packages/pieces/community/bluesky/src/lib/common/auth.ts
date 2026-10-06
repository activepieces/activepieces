import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { blueskyAtproto } from './atproto';
import { blueskyClient } from './client';

const description = `
To connect Bluesky:

1. **PDS Host**: Leave the default (https://bsky.social) unless your account lives on a self-hosted Personal Data Server.
2. **Identifier**: Your Bluesky handle (for example yourname.bsky.social) or the email address of the account.
3. **Password**: An **app password**. In Bluesky open **Settings → Privacy and security → App passwords**, click **Add App Password**, give it a name and paste the generated password here. Your main account password also works, but it grants full account access, so an app password is strongly recommended.

Bluesky limits sign-ins to 30 per 5 minutes and 300 per day per account.
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
      description: 'A Bluesky app password (recommended) or your account password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    let service: string;
    try {
      service = blueskyClient.normalizePdsHost(auth.pdsHost);
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Invalid PDS Host.' };
    }
    try {
      const { AtpAgent } = await blueskyAtproto.load();
      const agent = new AtpAgent({ service });
      await agent.login({ identifier: auth.identifier.trim(), password: auth.password });
      return { valid: true };
    } catch (error) {
      if (blueskyClient.isXrpcError(error) && (error.status === 401 || error.error === 'AuthenticationRequired')) {
        return { valid: false, error: 'Invalid credentials. Please check your identifier and app password.' };
      }
      if (blueskyClient.isXrpcError(error) && error.status === 429) {
        return { valid: false, error: 'Bluesky rate limit reached for sign-ins (30 per 5 minutes, 300 per day). Try again later.' };
      }
      if (blueskyClient.isXrpcError(error) && error.status === 400) {
        return { valid: false, error: `Invalid request. Please check your identifier format. (${error.message})` };
      }
      return {
        valid: false,
        error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

export type BlueSkyAuthType = {
  pdsHost?: string;
  identifier: string;
  password: string;
};
