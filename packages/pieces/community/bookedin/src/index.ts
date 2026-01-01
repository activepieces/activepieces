import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL, extractApiKey } from './lib/common/props';
import { getLeads } from "./lib/actions/get-leads";
import { createLead } from "./lib/actions/create-lead";
import { getLead } from "./lib/actions/get-lead";
import { deleteLead } from "./lib/actions/delete-lead";
import { getLeadStats } from "./lib/actions/get-lead-stats";
import { updateLead } from "./lib/actions/update-lead";
import { PieceCategory } from "@activepieces/shared";


// --- Authentication ---
export const bookedinAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `To connect your Bookedin account, please follow these steps to retrieve your API Key:

    1. Log in to your Bookedin Dashboard: dashboard.bookedin.ai
    2. From the left menu, go to **Business**
    3. Open **Settings**
    4. Click on **API Key**
    5. Copy your API Key (starts with **sk_…**)
    6. Paste the key below to authorize the integration

    Your API Key allows Activepieces to securely access your Bookedin leads, agents, and booking data.
    `,
  validate: async ({ auth }) => {
    try {
      const apiKey = extractApiKey(auth);

      if (!apiKey) {
        return { valid: false, error: 'API Key is empty' };
      }

      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BASE_URL}/agents/`, 
        headers: {
          'X-API-Key': apiKey as string,
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
  displayName: 'Bookedin',
  description: 'AI agents for lead conversion and appointment booking.',
  logoUrl: 'https://cdn.activepieces.com/pieces/bookedin.png',
  categories: [PieceCategory.SALES_AND_CRM],
  auth: bookedinAuth,
  minimumSupportedRelease: '0.36.1',
  authors: ["drona2938", "onyedikachi-david"],
  actions: [
    getLeads,
    createLead,
    getLead,
    deleteLead,
    getLeadStats,
    updateLead,
    createCustomApiCallAction({
      baseUrl: () => BASE_URL,
      auth: bookedinAuth,
      authMapping: async (auth) => {
        const apiKey = extractApiKey(auth);
        return {
          'X-API-Key': apiKey,
        };
      },
    }),
  ],
  triggers: [],
});
    