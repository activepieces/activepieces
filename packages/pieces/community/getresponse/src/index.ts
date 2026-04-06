import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { AppConnectionType, PieceCategory } from '@activepieces/shared';

import { createContactAction } from './lib/actions/create-contact';
import { createNewsletterAction } from './lib/actions/create-newsletter';
import { createOrUpdateContactAction } from './lib/actions/create-or-update-contact';
import { findCampaignListAction } from './lib/actions/find-campaign-list';
import { findContactAction } from './lib/actions/find-contact';
import { getresponseAuth } from './lib/common/auth';

export const getresponse = createPiece({
  displayName: 'GetResponse',
  description:
    'Email marketing and automation platform for contacts, campaigns, and newsletters.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/getresponse.png',
  categories: [PieceCategory.MARKETING],
  authors: ['veri5ied'],
  auth: getresponseAuth,
  actions: [
    createContactAction,
    createOrUpdateContactAction,
    findContactAction,
    createNewsletterAction,
    findCampaignListAction,
    createCustomApiCallAction({
      auth: getresponseAuth,
      baseUrl: () => 'https://api.getresponse.com/v3',
      authMapping: async (auth) => {
        if (auth.type === AppConnectionType.OAUTH2) {
          return { Authorization: `Bearer ${auth.access_token}` };
        }
        return { 'X-Auth-Token': `api-key ${auth.props.apiKey}` };
      },
    }),
  ],
  triggers: [],
});

export { getresponseAuth };
