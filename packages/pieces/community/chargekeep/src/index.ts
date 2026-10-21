import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addOrUpdateContactExtended } from './lib/actions/add-or-update-contact-extended';
import { addOrUpdateContact } from './lib/actions/add-or-update-contact';
import { addOrUpdateSubscription } from './lib/actions/add-or-update-subscription';
import { createInvoice } from './lib/actions/create-invoice';
import { newLead } from './lib/triggers/new-lead';
import { newPayment } from './lib/triggers/new-payment';
import { newSubscription } from './lib/triggers/new-subscription';
import { createProduct } from './lib/actions/create-product';
import { getContactDetails } from './lib/actions/get-contact-details';
import { chargekeepAuth } from './lib/auth';
import { upsertContact } from './lib/actions/ai/upsert-contact';
import { createInvoiceAi } from './lib/actions/ai/create-invoice-ai';
import { listContactGroups, listProducts, searchContacts } from './lib/actions/ai/search';
import { CHARGEKEEP_BASE_URLS, chargekeepClient } from './lib/common/client';

export const chargekeep = createPiece({
  displayName: 'ChargeKeep',
  description: 'Easy-to-use recurring and one-time payments software for Stripe & PayPal',
  auth: chargekeepAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/chargekeep.png',
  categories: [PieceCategory.COMMERCE, PieceCategory.PAYMENT_PROCESSING],
  authors: ['Trayshmhirk'],
  actions: [
    addOrUpdateContact,
    addOrUpdateContactExtended,
    addOrUpdateSubscription,
    createInvoice,
    createProduct,
    getContactDetails,
    upsertContact,
    createInvoiceAi,
    searchContacts,
    listProducts,
    listContactGroups,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth ? chargekeepClient.baseUrlOf(auth) : CHARGEKEEP_BASE_URLS[0]),
      auth: chargekeepAuth,
      authMapping: async (auth, propsValue) => {
        const base = chargekeepClient.baseUrlOf(auth);
        const urlProp = propsValue['url'];
        const url = chargekeepClient.isRecord(urlProp) && typeof urlProp['url'] === 'string' ? urlProp['url'].trim() : '';
        if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) {
          let parsed: URL | undefined;
          try {
            parsed = new URL(url);
          } catch {
            parsed = undefined;
          }
          if (!parsed || parsed.username || parsed.password || parsed.origin !== new URL(base).origin) {
            throw new Error(`The URL must be relative or start with ${base}/.`);
          }
        }
        if (url.split(/[/?#]/).some((part) => part === '..' || part.toLowerCase() === '%2e%2e')) {
          throw new Error('The URL must not contain ".." segments.');
        }
        return chargekeepClient.headersOf(auth);
      },
    }),
  ],
  triggers: [newLead, newPayment, newSubscription],
});
