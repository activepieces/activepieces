
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/props';

    
// --- Authentication ---
export const bookedinAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Enter your Bookedin AI API Key (starts with sk_...)',
  validate: async ({ auth }) => {
    try {
      // Validation Request: Mimics the working CURL command
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BASE_URL}/agents/`, 
        headers: {
          'X-API-Key': auth,
          'accept': 'application/json'
        },
        queryParams: {
            skip: '0',
            limit: '1'
        }
      });
      return { valid: true };
    } catch (e: any) {
      const errorMessage = e?.response?.body?.detail || e?.message || 'Connection failed';
      return { 
        valid: false, 
        error: errorMessage 
      };
    }
  },
}); 

// --- Piece Definition ---
export const bookedin = createPiece({
  displayName: 'Bookedin AI',
  description: 'AI agents for lead conversion and appointment booking.',
  logoUrl: 'https://cdn.activepieces.com/pieces/bookedin-ai.png',
  categories: [],
  auth: bookedinAuth,
  minimumSupportedRelease: '0.36.1',
  authors: [],
  actions: [],
  triggers: [],
});