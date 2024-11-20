import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createTask } from './lib/actions/create-task';
import { getClient } from './lib/actions/get-client';
import { getInvoices } from './lib/actions/get-invoices';
import { getReport } from './lib/actions/get-report';
import { existsTask } from './lib/actions/task-exists';
import { createInvoice } from './lib/actions/create-invoice';
import { createClient } from './lib/actions/create-client';
import { createRecurringInvoice } from './lib/actions/create-recurring';
import { actionRecurringInvoice } from './lib/actions/action-recurring';

export const invoiceninjaAuth = PieceAuth.CustomAuth({
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      description: 'Enter the base URL',
      required: true,
    }),
    access_token: Property.ShortText({
      displayName: 'API Token',
      description: 'Enter the API token',
      required: true,
    }),
  },
  description: `Please check https://invoice-ninja.readthedocs.io/en/latest/api_tokens.html#create-token
   to see how to get the API token`,
  required: true,
});

export const invoiceninja = createPiece({
  displayName: 'Invoice Ninja',
  description: 'Free open-source invoicing tool',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/invoiceninja.png',
  categories: [PieceCategory.ACCOUNTING],
  authors: ["buttonsbond","kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  auth: invoiceninjaAuth,
  actions: [
    createTask,
    existsTask,
    getClient,
    getInvoices,
    getReport,
    createInvoice,
    createClient,
    createRecurringInvoice,
    actionRecurringInvoice,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        `${(auth as { base_url: string }).base_url.replace(/\/$/, '')}/api/v1`,
      auth: invoiceninjaAuth,
      authMapping: async (auth) => ({
        'X-Api-Token': (auth as { access_token: string }).access_token,
      }),
    }),
  ],
  triggers: [],
});
