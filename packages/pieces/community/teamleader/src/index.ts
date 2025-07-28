
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { teamleaderAuth } from './lib/common/auth';
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
import { newContact } from './lib/triggers/new-contact';
import { newCompany } from './lib/triggers/new-company';
import { newDeal } from './lib/triggers/new-deal';
import { dealAccepted } from './lib/triggers/deal-accepted';
import { newInvoice } from './lib/triggers/new-invoice';

export const teamleader = createPiece({
    displayName: 'Teamleader',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/teamleader.png',
    categories: [PieceCategory.SALES_AND_CRM, PieceCategory.BUSINESS_INTELLIGENCE],
    authors: ['owuzo','onyedikachi-david'],
    auth: teamleaderAuth,
    actions: [
        createContact,
        updateContact,
        createCompany,
        updateCompany,
        linkContactToCompany,
        unlinkContactFromCompany,
        createDeal,
        updateDeal,
        searchCompanies,
        searchContacts,
        searchDeals,
        searchInvoices,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.focus.teamleader.eu',
            auth: teamleaderAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${(auth as any).access_token}`,
            }),
        }),
    ],
    triggers: [newContact, newCompany, newDeal, dealAccepted, newInvoice],
});