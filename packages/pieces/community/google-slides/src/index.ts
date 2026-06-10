import { createPiece, PieceAuth, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { refreshSheetsCharts } from "./lib/actions/refresh-charts";
import { generateFromTemplate } from "./lib/actions/generate-from-template";
import { getPresentation } from "./lib/actions/get-presentation";
import { googleSlidesAuth } from './lib/auth';

export const googleSlide = createPiece({
  displayName: "Google Slides",
  auth: googleSlidesAuth,
  minimumSupportedRelease: '0.36.1',
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
        Authorization: `Bearer ${(auth).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
