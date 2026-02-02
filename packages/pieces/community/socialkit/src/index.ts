import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, createCustomApiCallAction, HttpHeaders } from '@activepieces/pieces-common';
import { PieceCategory } from "@activepieces/shared";

import { getYoutubeDetails } from './lib/actions/get-youtube-details';
import { getYoutubeTranscript } from './lib/actions/get-youtube-transcript';
import { getYoutubeSummary } from './lib/actions/get-youtube-summary';
import { getYoutubeComments } from "./lib/actions/get-youtube-comment";


const socialkitApiUrl = 'https://api.socialkit.dev';

export const socialkitAuth = PieceAuth.SecretText({
  displayName: 'Access Key',
  description: `
    To get your Access Key:
    1. Sign up at SocialKit Dashboard
    2. Copy your Access Key from the project Access Keys tab.
    **Important:** Keep your Access Key confidential.
  `,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${socialkitApiUrl}/youtube/stats?access_key=${auth}&url=https://youtube.com/watch?v=dQw4w9WgXcQ`,
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Access Key.',
      };
    }
  },
});

export const socialkit = createPiece({
  displayName: "Socialkit",
  auth: socialkitAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/socialkit.png",
  authors: ['david-oluwaseun420'],
  categories: [PieceCategory.CONTENT_AND_FILES],
  actions: [
    getYoutubeDetails,
    getYoutubeTranscript,
    getYoutubeSummary,
    getYoutubeComments,
    createCustomApiCallAction({
      auth: socialkitAuth,
      baseUrl: () => socialkitApiUrl,
      authMapping: async (auth) => {
        return {
          'x-access-key': auth.secret_text
        } as HttpHeaders;
      }
    })
  ],
  triggers: [
  ],
});