import { createPiece, PieceAuth, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const googleSlidesAuth = PieceAuth.OAuth2({
  description: '',

  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/presentations.readonly',
    'https://www.googleapis.com/auth/drive.file',
  ],
});

export const googleSlide = createPiece({
  displayName: "Google Slides",
  auth: googleSlidesAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/google-slides.png",
  authors: ["Kevinyu-alan"],
  actions: [
    createCustomApiCallAction({
      baseUrl: () => 'https://slides.googleapis.com/v1/presentations/',
      auth: googleSlidesAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
