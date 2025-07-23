    import { createPiece } from '@activepieces/pieces-framework';
    import { TeamleaderAuth } from './lib/common';
    import { newContact } from './lib/triggers/new-contact';
    import { newCompany } from './lib/triggers/new-company';
    import { newDeal } from './lib/triggers/new-deal';
    import { dealAccepted } from './lib/triggers/deal-accepted';
    import { invoicePaid } from './lib/triggers/invoice-paid';
    import { createContact } from './lib/actions/create-contact';
    import { updateContact } from './lib/actions/update-contact';
    import { createCompany } from './lib/actions/create-company';
    import { updateCompany } from './lib/actions/update-company';
    import { linkContactToCompany } from './lib/actions/link-contact-to-company';
    import { unlinkContactFromCompany } from './lib/actions/unlink-contact-from-company';
    import { createDeal } from './lib/actions/create-deal';
    import { updateDeal } from './lib/actions/update-deal';
    import { searchCompanies } from './lib/actions/search-companies';
    import { searchContacts } from './lib/actions/search-contacts';
    import { searchDeals } from './lib/actions/search-deals';
    import { searchInvoices } from './lib/actions/search-invoices';

    export const teamleader = createPiece({
      displayName: 'Teamleader',
      logoUrl: 'https://cdn.activepieces.com/pieces/teamleader.png',
      auth: TeamleaderAuth,
      authors: ['pranjal'],
      triggers: [
        newContact, newCompany, newDeal, dealAccepted, invoicePaid
      ],
      actions: [
        createContact, updateContact, createCompany, updateCompany,
        linkContactToCompany, unlinkContactFromCompany,
        createDeal, updateDeal,
        searchCompanies, searchContacts, searchDeals, searchInvoices
      ],
    });
    