import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { zohoInvoiceAiActions } from './lib/actions/ai';
import { zohoInvoiceAuth } from './lib/auth';
import { zohoInvoiceClient } from './lib/common/client';
import { newInvoiceTrigger } from './lib/triggers/new-invoice';

export const zohoInvoice = createPiece({
  displayName: 'Zoho Invoice',
  description: 'Online invoicing software for businesses',

  auth: zohoInvoiceAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/zoho-invoice.png',
  categories: [PieceCategory.ACCOUNTING],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  actions: [
    ...zohoInvoiceAiActions,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth ? zohoInvoiceClient.baseUrl({ auth }) : ''),
      auth: zohoInvoiceAuth,
      authMapping: async (auth) => zohoInvoiceClient.authHeaders({ auth }),
    }),
  ],
  triggers: [newInvoiceTrigger],
});
