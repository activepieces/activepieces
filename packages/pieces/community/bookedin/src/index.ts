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
import { bookedinAuth } from './lib/auth';

// --- Authentication ---
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
    