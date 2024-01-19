import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { newInvoice } from './lib/triggers/new-invoice';

export const zohoAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://accounts.zoho.{region}/oauth/v2/auth',
  tokenUrl: 'https://accounts.zoho.{region}/oauth/v2/token',
  scope: ['ZohoInvoice.invoices.READ'],
  props: {
    region: Property.StaticDropdown({
      displayName: 'Region',
      description: 'Select your account region',
      required: true,
      options: {
        options: [
          {
            label: 'US (.com)',
            value: 'com',
          },
          {
            label: 'Europe (.eu)',
            value: 'eu',
          },
          {
            label: 'India (.in)',
            value: 'in',
          },
          {
            label: 'Australia (.com.au)',
            value: 'com.au',
          },
          {
            label: 'Japan (.jp)',
            value: 'jp',
          },
        ],
      },
    }),
  },
});

export const zohoInvoice = createPiece({
  displayName: 'Zoho Invoice',
  auth: zohoAuth,
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/zoho-invoice.png',
  authors: ['MoShizzle'],
  actions: [],
  triggers: [newInvoice],
});
