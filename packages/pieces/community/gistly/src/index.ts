import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getTranscriptAction } from './lib/actions/get-transcript';
import { PieceCategory } from '@activepieces/shared';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gistlyConfig } from './lib/config';

const markdownDescription = `
To obtain your free Gistly API Key, sign up at [Gistly](https://gist.ly/youtube-transcript-api) and then copy the key available in the [dashboard](https://api-portal.gist.ly/).
`;

export const gistlyAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${gistlyConfig.baseUrl}/health`,
        headers: {
          [gistlyConfig.accessTokenHeaderKey]: auth.auth,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key.',
      };
    }
  },
});

export const gistly = createPiece({
  displayName: 'Gistly',
  auth: gistlyAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/gistly.svg',
  authors: ['rafalzawadzki'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.DEVELOPER_TOOLS, PieceCategory.CONTENT_AND_FILES],
  description: 'YouTube Transcripts',
  actions: [getTranscriptAction],
  triggers: [],
}); 