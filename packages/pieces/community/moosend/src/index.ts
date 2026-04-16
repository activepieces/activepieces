import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { moosendAuth } from './lib/common/auth';
import { addSubscriber } from './lib/actions/add-subscriber';
import { unsubscribeMember } from './lib/actions/unsubscribe-member';
import { createCampaign } from './lib/actions/create-campaign';
import { getCampaignStatistics } from './lib/actions/get-campaign-statistics';

export const moosend = createPiece({
  displayName: 'Moosend',
  description: 'Email marketing platform for campaigns, subscriber management, and analytics.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/moosend.png',
  categories: [PieceCategory.MARKETING],
  authors: ['tarai-dl'],
  auth: moosendAuth,
  actions: [
    addSubscriber,
    unsubscribeMember,
    createCampaign,
    getCampaignStatistics,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.moosend.com/v3',
      auth: moosendAuth,
      authMapping: async (auth) => {
        return {
          apikey: (auth as { secret_text: string }).secret_text,
        };
      },
    }),
  ],
  triggers: [],
});
