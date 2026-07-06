import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const trustAuth = PieceAuth.CustomAuth({
  displayName: 'Connection',
  description: 'Connect your Trust account using your Workspace ID and API key.',
  required: true,
  props: {
    workspace_id: Property.ShortText({
      displayName: 'Workspace ID',
      description:
        'Your Trust workspace ID. Find it in your Trust dashboard URL: https://app.usetrust.io/workspace/{workspaceId}/...',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description:
        'Go to your Trust dashboard > Settings > API to generate an API key.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.usetrust.app/v1/workspaces',
        authentication: {
          type: AuthenticationType.BASIC,
          username: 'apikey',
          password: auth.api_key,
        },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API key. Please check your credentials and try again.' };
    }
  },
});
