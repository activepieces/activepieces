import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { downloadTransactions } from './lib/actions/download-transactions';

export const ingAustraliaAuth = PieceAuth.BasicAuth({
  description: 'Enter your client number and PIN code',
  required: true,
  username: {
      displayName: 'Client number',
      description: 'Enter your ING Bank Australia client number',
  },
  password: {
      displayName: 'PIN code',
      description: 'Enter your PIN code',
  },
  // Optional Validation
  validate: async ({auth}) => {
      if(auth){
          return {
              valid: true,
          }
      }
      return {
          valid: false,
          error: ''
      }
  }
});

export const ingAustralia = createPiece({
  displayName: "ING Bank Australia",
  categories: [PieceCategory.ACCOUNTING],
  auth: ingAustraliaAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: "https://www.ing.com.au/img/logos/ing.webp",
  authors: [],
  actions: [downloadTransactions],
  triggers: [],
});
