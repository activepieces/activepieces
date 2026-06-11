import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sendsparkAuth = PieceAuth.CustomAuth({
  displayName: 'Connection',
  required: true,
  props: {
    workspace_id: Property.ShortText({
      displayName: 'Workspace ID',
      description:
        'Found in the API Credentials tab at https://sendspark.com/settings/api-credentials.',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description:
        'Workspace-specific. Go to Settings > API Credentials and click "Create New Key".',
      required: true,
    }),
    api_secret: PieceAuth.SecretText({
      displayName: 'API Secret',
      description:
        'User-profile-specific. Go to Settings > API Credentials, click the key icon, and select "Generate New Secret Key". Save it immediately — it cannot be viewed again.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api-gw.sendspark.com/v1/workspaces/${auth.workspace_id}/dynamics`,
        headers: {
          'x-api-key': auth.api_key,
          'x-api-secret': auth.api_secret,
        },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid Workspace ID, API Key, or API Secret.' };
    }
  },
});
