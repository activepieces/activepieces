import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { Property } from '@activepieces/pieces-framework';
import { identifyCustomer } from './lib/actions/identify-customer.action';
import { trackEvent } from './lib/actions/track-event.action';
import { deleteCustomer } from './lib/actions/delete-customer.action';
import { sendTransactionalEmail } from './lib/actions/send-transactional-email.action';
import { newCustomer } from './lib/triggers/new-customer.trigger';

export const customerioAuth = PieceAuth.CustomAuth({
  description: 'Connect your Customer.io account',
  required: true,
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'Your Customer.io Site ID (from Integrations > API Credentials)',
      required: true,
    }),
    api_key: Property.SecretText({
      displayName: 'Track API Key',
      description: 'Your Customer.io API Key (for tracking)',
      required: true,
    }),
    app_api_key: Property.SecretText({
      displayName: 'App API Key',
      description: 'Your Customer.io App API Key (for sending and reading data)',
      required: true,
    }),
  },
});

export const customerio = createPiece({
  displayName: 'Customer.io',
  description: 'Behavioral email and marketing automation',
  auth: customerioAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/customerio.png',
  categories: [PieceCategory.MARKETING],
  authors: ['Tosh94'],
  actions: [identifyCustomer, trackEvent, deleteCustomer, sendTransactionalEmail],
  triggers: [newCustomer],
});
