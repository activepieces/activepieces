import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { nutshellAuth } from './lib/auth';
import { getLeadAction, createLeadAction, updateLeadAction, searchLeadsAction } from './lib/actions/leads';
import { getContactAction, createContactAction, updateContactAction, searchContactsAction } from './lib/actions/contacts';
import { getCompanyAction, createCompanyAction, updateCompanyAction, searchCompaniesAction } from './lib/actions/companies';

const apiCallAction = createCustomApiCallAction({
  baseUrl: () => 'https://app.nutshell.com/api/v1/json',
  auth: nutshellAuth,
  authMapping: async (auth) => {
    const credentials = auth as { email: string; apiKey: string };
    const encoded = Buffer.from(`${credentials.email}:${credentials.apiKey}`).toString('base64');
    return { Authorization: `Basic ${encoded}` };
  },
});

const nutshellCrm = createPiece({
  displayName: 'Nutshell CRM',
  description: 'Sales CRM and pipeline management for small and mid-sized B2B teams',
  auth: nutshellAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/nutshell-crm.png',
  authors: ['tarai-dl'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    getLeadAction,
    createLeadAction,
    updateLeadAction,
    searchLeadsAction,
    getContactAction,
    createContactAction,
    updateContactAction,
    searchContactsAction,
    getCompanyAction,
    createCompanyAction,
    updateCompanyAction,
    searchCompaniesAction,
    apiCallAction,
  ],
  triggers: [],
});

export { nutshellCrm };
