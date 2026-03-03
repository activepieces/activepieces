import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { searchAction } from './lib/actions/search';
import { googleSearchAuth } from './lib/auth';

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