import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { createTask } from './lib/actions/create-task';
import { existsTask } from './lib/actions/task-exists';
import { getClient } from './lib/actions/get-client';
import { getInvoices } from './lib/actions/get-invoices';
import { getReport } from './lib/actions/get-report';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

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
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/invoiceninja.png',
  authors: ['buttonsbond'],
  auth: invoiceninjaAuth,
  actions: [createTask, existsTask, getClient, getInvoices, getReport,
    createCustomApiCallAction({
        baseUrl: (auth) => `${(auth as { base_url: string }).base_url.replace(/\/$/, '')}/api/v1`,
        auth: invoiceninjaAuth,
        authMapping: (auth) => ({
            'X-Api-Token': (auth as { access_token: string }).access_token,
        })
    })
],
  triggers: [],
});
