import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { pastefyClient } from './client';

export const pastefyAuth = PieceAuth.CustomAuth({
  displayName: 'Pastefy Connection',
  description: `
To connect Pastefy:
1. Sign in at [pastefy.app](https://pastefy.app) (or your own Pastefy instance).
2. Open [API Keys](https://pastefy.app/apikeys) and create a key with the paste and folder permissions you need.
3. Paste the key below (optional: without it you can only create and read pastes anonymously). Leave the instance URL as is unless you run your own Pastefy server.
`,
  required: true,
  props: {
    instance_url: Property.ShortText({
      displayName: 'Pastefy Instance URL',
      description: 'Base URL of your Pastefy server, for example https://pastefy.app.',
      required: false,
      defaultValue: 'https://pastefy.app',
    }),
    token: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Optional. Without a key you can only create and read pastes anonymously; folders, your own pastes, editing and deleting need a key.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    if (!pastefyClient.tokenOf({ auth: { props: auth } })) {
      return { valid: true };
    }
    try {
      const user = await pastefyClient.request({
        auth: { props: auth },
        method: HttpMethod.GET,
        path: '/user',
      });
      if (pastefyClient.isRecord(user) && user['logged_in'] === true) {
        return { valid: true };
      }
      return { valid: false, error: 'Pastefy did not accept this API key.' };
    } catch (error) {
      const status = pastefyClient.statusOf(error);
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Invalid API key.' };
      }
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Could not reach the Pastefy instance.',
      };
    }
  },
});
