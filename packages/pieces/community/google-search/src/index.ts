import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { searchAction } from './lib/actions/search';

const markdownDescription = `
Follow these steps to obtain your Google Cloud API Key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Navigate to **APIs & Services** > **Enabled APIs & services**.
4. Click **+ ENABLE APIS AND SERVICES** and enable **Vertex AI Search** (Discovery Engine API).
5. Go to **APIs & Services** > **Credentials**.
6. Click **Create Credentials** > **API key**.
7. Copy the API key and paste it below.
`;

export const googleSearchAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Google Cloud API key with Vertex AI Search access.',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'Your Google Cloud project ID.',
      required: true,
    }),
    appId: Property.ShortText({
      displayName: 'App ID',
      description: 'The Vertex AI Search app (engine) ID.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const { apiKey, projectId, appId } = auth;
      const url = `https://discoveryengine.googleapis.com/v1/projects/${projectId}/locations/global/collections/default_collection/engines/${appId}/servingConfigs/default_search:searchLite?key=${apiKey}`;
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url,
        headers: { 'Content-Type': 'application/json' },
        body: {
          query: 'test',
        },
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

export const googleSearch = createPiece({
  displayName: 'Google Search',
  description: 'Search using Vertex AI Search (Discovery Engine)',
  auth: googleSearchAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-search.png',
  authors: ['onyedikachi-david'],
  actions: [searchAction],
  triggers: [],
});