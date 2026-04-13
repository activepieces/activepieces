import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { elasticEmailAuth } from './lib/auth';
import { ELASTIC_EMAIL_API_BASE } from './lib/common/constants';
import { addContactAction } from './lib/actions/add-contact';
import { createCampaignAction } from './lib/actions/create-campaign';
import { createContactAction } from './lib/actions/create-contact';
import { createSegmentAction } from './lib/actions/create-segment';
import { listCampaignsAction } from './lib/actions/list-campaigns';
import { listContactsAction } from './lib/actions/list-contacts';
import { sendEmailAction } from './lib/actions/send-email';
import { unsubscribeContactAction } from './lib/actions/unsubscribe-contact';
import { updateCampaignAction } from './lib/actions/update-campaign';
import { updateContactAction } from './lib/actions/update-contact';

export const elasticEmail = createPiece({
  displayName: 'Elastic Email',
  description:
    'Email delivery and marketing platform for sending emails, managing contacts, campaigns, and segments.',
  auth: elasticEmailAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/elastic-email.png',
  authors: ['Harmatta'],
  categories: [PieceCategory.MARKETING],
  actions: [
    addContactAction,
    createCampaignAction,
    createContactAction,
    createSegmentAction,
    listCampaignsAction,
    listContactsAction,
    sendEmailAction,
    unsubscribeContactAction,
    updateCampaignAction,
    updateContactAction,
    createCustomApiCallAction({
      baseUrl: () => ELASTIC_EMAIL_API_BASE,
      auth: elasticEmailAuth,
      authMapping: async (auth) => ({
        'X-ElasticEmail-ApiKey': auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});
