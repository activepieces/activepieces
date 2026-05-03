import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { omnisendAuth } from './lib/auth';
import { OMNISEND_API_BASE } from './lib/common/client';
import { createOrUpdateContactAction } from './lib/actions/create-or-update-contact';
import { getContactAction } from './lib/actions/get-contact';
import { listContactsAction } from './lib/actions/list-contacts';
import { sendCustomerEventAction } from './lib/actions/send-customer-event';
import { listCampaignsAction } from './lib/actions/list-campaigns';

export const omnisend = createPiece({
  displayName: 'Omnisend',
  description:
    'All-in-one ecommerce marketing platform for email, SMS, and push notification campaigns with powerful automation and segmentation.',
  auth: omnisendAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/omnisend.png',
  categories: [PieceCategory.MARKETING, PieceCategory.SALES_AND_CRM],
  authors: ['Harmatta'],
  actions: [
    createOrUpdateContactAction,
    getContactAction,
    listContactsAction,
    sendCustomerEventAction,
    listCampaignsAction,
    createCustomApiCallAction({
      auth: omnisendAuth,
      baseUrl: () => OMNISEND_API_BASE,
      authMapping: async (auth) => ({
        'X-API-KEY': auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});
