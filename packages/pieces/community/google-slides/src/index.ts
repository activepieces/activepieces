import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework'
import { generateFromTemplate } from './lib/actions/generate-from-template'
import { getPresentation } from './lib/actions/get-presentation'
import { refreshSheetsCharts } from './lib/actions/refresh-charts'

export const googleSlidesAuth = PieceAuth.OAuth2({
  description: '',

  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
})

export const googleSlide = createPiece({
  displayName: 'Google Slides',
  auth: googleSlidesAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-slides.png',
  authors: ['Kevinyu-alan'],
  actions: [
    getPresentation,
    refreshSheetsCharts,
    generateFromTemplate,
    createCustomApiCallAction({
      baseUrl: () => 'https://slides.googleapis.com/v1/presentations/',
      auth: googleSlidesAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
})
