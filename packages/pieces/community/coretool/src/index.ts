import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { checkLeitwegId } from './lib/actions/check-leitweg-id';
import { createEInvoice } from './lib/actions/create-e-invoice';
import { getUsage } from './lib/actions/get-usage';
import { validateEInvoice } from './lib/actions/validate-e-invoice';
import { coretoolAuth } from './lib/auth';
import { BASE_URL } from './lib/common/client';

export const coretool = createPiece({
  displayName: 'Coretool',
  description:
    'Create and validate German e-invoices (ZUGFeRD, XRechnung) for businesses, freelancers and the self-employed.',
  auth: coretoolAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/coretool.png',
  categories: [PieceCategory.ACCOUNTING],
  authors: ['coretool-de'],
  actions: [
    createEInvoice,
    validateEInvoice,
    checkLeitwegId,
    getUsage,
    createCustomApiCallAction({
      baseUrl: () => BASE_URL,
      auth: coretoolAuth,
      authMapping: async (auth) => ({
        'X-API-Key': auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});
