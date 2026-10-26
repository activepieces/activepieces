import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { hunterAuth } from './lib/auth';
import { BASE_URL, apiKeyOf, authHeaders } from './lib/common/client';
import { addRecipientsAction } from './lib/actions/add-recipients';
import { countEmailsAction } from './lib/actions/count-emails';
import { createLeadAction } from './lib/actions/create-lead';
import { deleteLeadAction } from './lib/actions/delete-lead';
import { findEmailAction } from './lib/actions/find-email';
import { getLeadAction } from './lib/actions/get-lead';
import { searchLeadsAction } from './lib/actions/search-leads';
import { updateLeadAction } from './lib/actions/update-lead';
import { verifyEmailAction } from './lib/actions/verify-email';
import { domainSearchAction } from './lib/actions/domain-search';
import { upsertLeadAction } from './lib/actions/upsert-lead';
import { listLeadsListsAction } from './lib/actions/list-leads-lists';
import { getLeadsListAction } from './lib/actions/get-leads-list';
import { createLeadsListAction } from './lib/actions/create-leads-list';
import { listCampaignsAction } from './lib/actions/list-campaigns';
import { removeCampaignRecipientsAction } from './lib/actions/remove-campaign-recipients';
import { getAccountAction } from './lib/actions/get-account';
import { enrichPersonAndCompanyAction } from './lib/actions/enrich-person-and-company';
import { enrichCompanyAction } from './lib/actions/enrich-company';
import { getLeadByIdAction } from './lib/actions/ai/get-lead-by-id';
import { updateLeadByIdAction } from './lib/actions/ai/update-lead-by-id';
import { deleteLeadByIdAction } from './lib/actions/ai/delete-lead-by-id';
import { addCampaignRecipientsByIdAction } from './lib/actions/ai/add-campaign-recipients-by-id';
import { newLeadTrigger } from './lib/triggers/new-lead';

export const hunter = createPiece({
  displayName: 'Hunter',
  description:
    'Find, verify and manage professional email addresses at scale. Automate email discovery, validation, lead tracking, and campaign outreach with Hunter.io.',
  auth: hunterAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/hunter.png',
  authors: ['varshith257', 'OdaiAhmed99'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    addRecipientsAction,
    countEmailsAction,
    createLeadAction,
    deleteLeadAction,
    findEmailAction,
    getLeadAction,
    searchLeadsAction,
    updateLeadAction,
    verifyEmailAction,
    domainSearchAction,
    upsertLeadAction,
    listLeadsListsAction,
    getLeadsListAction,
    createLeadsListAction,
    listCampaignsAction,
    removeCampaignRecipientsAction,
    getAccountAction,
    enrichPersonAndCompanyAction,
    enrichCompanyAction,
    getLeadByIdAction,
    updateLeadByIdAction,
    deleteLeadByIdAction,
    addCampaignRecipientsByIdAction,
    createCustomApiCallAction({
      baseUrl: () => BASE_URL,
      auth: hunterAuth,
      authMapping: async (auth) => authHeaders(apiKeyOf(auth)),
    }),
  ],
  triggers: [newLeadTrigger],
});
