import { createPiece } from "@activepieces/pieces-framework";
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { refreshSheetsCharts } from "./lib/actions/refresh-charts";
import { generateFromTemplate } from "./lib/actions/generate-from-template";
import { getPresentation } from "./lib/actions/get-presentation";
import { getAccessToken, googleSlidesAuth, GoogleSlidesAuthValue } from './lib/auth';

export { googleSlidesAuth, getAccessToken, GoogleSlidesAuthValue } from './lib/auth';

export const googleSlide = createPiece({
  displayName: "Google Slides",
  auth: googleSlidesAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: "https://cdn.activepieces.com/pieces/google-slides.png",
  authors: ["Kevinyu-alan"],
  actions: [
    getPresentation,
    refreshSheetsCharts,
    generateFromTemplate,
    createCustomApiCallAction({
      baseUrl: () => 'https://slides.googleapis.com/v1/presentations/',
      auth: googleSlidesAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${await getAccessToken(auth as GoogleSlidesAuthValue)}`,
      }),
    }),
  ],
  triggers: [],
});
