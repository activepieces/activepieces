import { createPiece } from "@activepieces/pieces-framework";
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';

import { getYoutubeDetails } from './lib/actions/get-youtube-details';
import { getYoutubeTranscript } from './lib/actions/get-youtube-transcript';
import { getYoutubeSummary } from './lib/actions/get-youtube-summary';
import { getYoutubeComments } from "./lib/actions/get-youtube-comment";
import { socialkitAuth } from './lib/auth';

const socialkitApiUrl = 'https://api.socialkit.dev';

export const socialkit = createPiece({
  displayName: "Socialkit",
  auth: socialkitAuth,
  minimumSupportedRelease: '0.88.2',
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
        };
      },
      props: {
        url: {
          description: `Full URL, or a path relative to ${socialkitApiUrl}`,
          placeholder: '/youtube/stats',
        },
        queryParams: {
          description: 'Most SocialKit endpoints take the video link as the url parameter.',
        },
      },
    })
  ],
  triggers: [
  ],
});