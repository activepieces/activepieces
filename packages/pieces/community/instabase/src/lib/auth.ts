import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdown = `
## Instabase AI Hub Connection Setup

### Prerequisites
- Create an AI Hub account at [Instabase](https://www.instabase.com)
- Generate an API token from your account settings
- Obtain your organization ID or user ID for the IB-Context header

### Authentication Fields

**API Token**: Your API token from Instabase (required for Bearer authentication)

**IB Context**: Your organization ID or user ID
- For organization accounts: Use your organization ID
- For community accounts: Use your user ID or omit this field

**API Root URL**: The base URL for API calls
- For community accounts: \`https://aihub.instabase.com/api\`
- For organization accounts: \`https://your-organization.instabase.com/api\` (replace with your custom domain)
`;

export const instabaseAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdown,
  props: {
    apiToken: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'Your Instabase API token',
      required: true,
    }),
    ibContext: Property.ShortText({
      displayName: 'IB Context',
      description: 'Organization ID (for org accounts) or User ID (for community accounts)',
      required: false,
    }),
    apiRoot: Property.ShortText({
      displayName: 'API Root URL',
      description: 'API base URL (e.g., https://aihub.instabase.com/api for community accounts)',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const { apiToken, ibContext, apiRoot } = auth;

      try {
        const parsedUrl = new URL(apiRoot);
        if (parsedUrl.protocol !== 'https:') {
          return {
            valid: false,
            error: 'API Root URL must use HTTPS protocol'
          };
        }
        if (!parsedUrl.pathname.endsWith('/api')) {
          return {
            valid: false,
            error: 'API Root URL must end with /api'
          };
        }
      } catch {
        return {
          valid: false,
          error: 'Please enter a valid API Root URL'
        };
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      };

      if (ibContext) {
        headers['IB-Context'] = ibContext;
      }

      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${apiRoot}/v2/batches`,
        headers,
        body: { name: 'test-connection' },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: apiToken,
        },
      });

      if (response.status >= 200 && response.status < 300) {
        return {
          valid: true,
        };
      }

      return {
        valid: false,
        error: `API connection failed with status ${response.status}. Please check your credentials and API root URL.`,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please verify your API token and URL.`,
      };
    }
  },
});
