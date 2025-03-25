
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { checkAddressSanction } from './lib/actions/check-address-sanction';

export const chainalysisApiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'API Key for Chainalysis Screening API',
  required: true,
})

export const chainalysisApi = createPiece({
  displayName: "Chainalysis Screening API",
  description: "Chainalysis Screening API allows you to check if a blockchain address is sanctioned.",
  auth: chainalysisApiAuth,
  minimumSupportedRelease: '0.20.0',
  categories: [],
  logoUrl: "https://cdn.activepieces.com/pieces/chainalysis-api.jpg",
  authors: ['ahmad-swanblocks'],
  actions: [checkAddressSanction],
  triggers: [],
});