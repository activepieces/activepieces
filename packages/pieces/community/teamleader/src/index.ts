import { createPiece } from '@activepieces/pieces-framework';
import { teamleaderAuth } from './lib/common/auth';
import { createContact } from './lib/actions/create-contact';
import { updateContact } from './lib/actions/update-contact';
import { createCompany } from './lib/actions/create-company';
import { createDeal } from './lib/actions/create-deal';
import { linkContactToCompany } from './lib/actions/link-contact-to-company';
import { searchCompanies } from './lib/actions/search-companies';
import { unlinkContactFromCompany } from './lib/actions/unlink-contact-from-company';
import { searchContacts } from './lib/actions/search-contacts';
import { searchDeals } from './lib/actions/search-deals';
import { searchInvoices } from './lib/actions/search-invoices';
import { updateCompany } from './lib/actions/update-company';
import { updateDeal } from './lib/actions/update-deal';
import { dealAccepted } from './lib/triggers/deal-accepted';
// import { newInvoice } from './lib/triggers/new-invoice';
import { newContact } from './lib/triggers/new-contact';
import { newCompany } from './lib/triggers/new-company';
import { newDeal } from './lib/triggers/new-deal';
import { newInvoice } from './lib/triggers/new-invoice';

export const teamleader = createPiece({
  displayName: 'Teamleader',
  auth: teamleaderAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/teamleader.png',
  authors: ['Sanket6652'],
  actions: [
    createCompany,
    createContact,
    createDeal,
    linkContactToCompany,
    searchCompanies,
    searchContacts,
    searchDeals,
    searchInvoices,
    unlinkContactFromCompany,
    updateCompany,
    updateContact,
    updateDeal,
  ],
  triggers: [
    dealAccepted,
    newDeal,
    newCompany,
    newContact,
    newInvoice, 
  ],
});
