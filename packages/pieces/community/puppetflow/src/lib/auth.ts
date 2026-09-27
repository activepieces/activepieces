import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { puppetflowRequest } from './common/client';

const authDescription = `
**Instance URL**: The URL of your Puppetflow Cloud or self-hosted instance, for example \`https://your-team.puppetflow.com\`.

**API Key**: In Puppetflow, click your name at the bottom-left of the sidebar, open **Profile > API Keys**, and create a key. The full key is shown only once.
`;

export const puppetflowAuth = PieceAuth.CustomAuth({
  displayName: 'Connection',
  description: authDescription,
  required: true,
  props: {
    instanceUrl: Property.ShortText({
      displayName: 'Instance URL',
      description: 'Base URL of your Puppetflow instance, without a trailing path',
      required: true,
      defaultValue: 'https://your-team.puppetflow.com',
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'API key generated from Profile > API Keys',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await puppetflowRequest({
        credentials: auth,
        method: HttpMethod.GET,
        path: '/flows',
        query: { limit: 1 },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Could not connect to Puppetflow. Check the instance URL and the API key.',
      };
    }
  },
});
