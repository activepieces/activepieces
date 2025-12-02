
import { createPiece } from '@activepieces/pieces-framework';
import { pollybotAuth } from './lib/auth';
import { createLead } from './lib/actions/create-lead';
import { getLead } from './lib/actions/get-lead';
import { updateLead } from './lib/actions/update-lead';
import { deleteLead } from './lib/actions/delete-lead';
import { listLeads } from './lib/actions/list-leads';
import { PieceCategory } from '@activepieces/shared';
import { newLead } from './lib/triggers/new-lead';

export const pollybotAi = createPiece({
  displayName: 'PollyBot AI',
  description: 'Automate lead management with PollyBot AI chatbot integration.',
  auth: pollybotAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl:
    'https://res.cloudinary.com/dnqgorjtl/image/upload/v1764630631/PollyBotFavicon_tb93xy.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['Trayshmhirk'],
  actions: [createLead, getLead, updateLead, deleteLead, listLeads],
  triggers: [newLead],
});
