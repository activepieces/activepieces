import { createPiece, PieceAuth } from '@ensemble/pieces-framework';
import { getTranscriptAction } from './lib/actions/get-transcript';
import { PieceCategory } from '@ensemble/shared';
import { httpClient, HttpMethod } from '@ensemble/pieces-common';
import { supadataConfig } from './lib/config';

const markdownDescription = `
To obtain your free Supadata API Key, sign up at [Supadata](https://supadata.ai) and then copy the key available in the [dashboard](https://dash.supadata.ai).
`;

export const supadataAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${supadataConfig.baseUrl}/health`,
        headers: {
          [supadataConfig.accessTokenHeaderKey]: auth.auth,
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

export const supadata = createPiece({
  displayName: 'Supadata',
  auth: supadataAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/supadata.svg',
  authors: ['rafalzawadzki'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.DEVELOPER_TOOLS, PieceCategory.CONTENT_AND_FILES],
  description: 'YouTube Transcripts',
  actions: [getTranscriptAction],
  triggers: [],
}); 