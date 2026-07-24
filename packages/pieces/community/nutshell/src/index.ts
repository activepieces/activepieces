import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createLead } from './lib/actions/create-lead';
import { getLead } from './lib/actions/get-lead';
import { updateLead } from './lib/actions/update-lead';
import { searchLeads } from './lib/actions/search-leads';
import { createContact } from './lib/actions/create-contact';
import { getContact } from './lib/actions/get-contact';
import { updateContact } from './lib/actions/update-contact';
import { searchContacts } from './lib/actions/search-contacts';
import { createCompany } from './lib/actions/create-company';
import { getCompany } from './lib/actions/get-company';
import { updateCompany } from './lib/actions/update-company';
import { searchCompanies } from './lib/actions/search-companies';
import { nutshellAuth } from './lib/common/auth';

export const nutshell = createPiece({
  displayName: 'Nutshell',
  description: 'Sales CRM for managing leads, contacts, and companies.',
  auth: nutshellAuth,
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.SALES_AND_CRM],
  logoUrl: 'https://cdn.activepieces.com/pieces/nutshell.png',
  authors: ['activepieces'],
  actions: [
    createLead,
    getLead,
    updateLead,
    searchLeads,
    createContact,
    getContact,
    updateContact,
    searchContacts,
    createCompany,
    getCompany,
    updateCompany,
    searchCompanies,
  ],
  triggers: [],
});
