import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';

export const MollieAuth = PieceAuth.OAuth2({
  description: `

`,
  authUrl: 'https://www.mollie.com/oauth2/authorize',
  tokenUrl: 'https://api.mollie.com/oauth2/tokens',
  required: true,
  scope: [
    'payments.read',
    'payments.write',
    'payment-links.write',
    'refunds.read',
    'refunds.write',
    'customers.read',
    'customers.write',
    'mandates.read',
    'mandates.write',
    'subscriptions.read',
    'subscriptions.write',
    'profiles.read',
    'invoices.read',
    'settlements.read',
    'orders.read',
    'orders.write',
    'shipments.read',
    'shipments.write',
    'organizations.read',
    'organizations.write',
  ],
});
