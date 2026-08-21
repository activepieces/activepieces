import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { famulorAuth } from './lib/common/auth';
import { resolveFamulorAuth } from './lib/common/client';
import { makePhoneCall } from './lib/actions/make-phone-call';
import { listCalls } from './lib/actions/list-calls';
import { getCall } from './lib/actions/get-call';
import { listAssistants } from './lib/actions/list-assistants';
import { createAssistant } from './lib/actions/create-assistant';
import { listCampaigns } from './lib/actions/list-campaigns';
import { createCampaign } from './lib/actions/create-campaign';
import { phoneCallEnded } from './lib/triggers/phone-call-ended';
import { getAssistants } from './lib/triggers/get-assistants';

export { famulorAuth };

export const famulor = createPiece({
  displayName: 'Famulor',
  auth: famulorAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/famulor.png',
  description:
    'Famulor Platform 2.0 — AI phone assistants, outbound calls, and campaigns over REST API v1.',
  authors: ['bekservice', 'onyedikachi-david'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    makePhoneCall,
    listCalls,
    getCall,
    listAssistants,
    createAssistant,
    listCampaigns,
    createCampaign,
    createCustomApiCallAction({
      auth: famulorAuth,
      baseUrl: (auth) =>
        auth
          ? resolveFamulorAuth(auth).apiBaseUrl
          : 'https://app.famulor.io/api/v1',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${resolveFamulorAuth(auth).apiKey}`,
      }),
    }),
  ],
  triggers: [phoneCallEnded, getAssistants],
});
