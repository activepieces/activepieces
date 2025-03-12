
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
  logoUrl: "https://imagedelivery.net/bHREz764QO9n_1kIQUR2sw/1be6c21c-7624-43be-3723-202cc088a100/public",
  authors: ['Swanblocks/Ahmad Shawar'],
  actions: [checkAddressSanction],
  triggers: [],
});