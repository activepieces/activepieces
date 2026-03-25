import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { partnerstackAuth, PARTNERSTACK_BASE_URL } from './lib/auth';
import { createRewardAction } from './lib/actions/create-reward';
import { getPartnerAction } from './lib/actions/get-partner';
import { listPartnersAction } from './lib/actions/list-partners';

export const partnerstack = createPiece({
  displayName: 'PartnerStack',
  description: 'Partner and affiliate program management platform.',
  auth: partnerstackAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://partnerstack.com/favicon.ico',
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.MARKETING],
  authors: ['Harmatta'],
  actions: [
    listPartnersAction,
    createRewardAction,
    getPartnerAction,
    createCustomApiCallAction({
      baseUrl: () => PARTNERSTACK_BASE_URL,
      auth: partnerstackAuth,
      authMapping: async (auth) => {
        const publicKey = auth?.props?.publicKey ?? '';
        const privateKey = auth?.props?.privateKey ?? '';
        return {
          Authorization: `Basic ${Buffer.from(`${publicKey}:${privateKey}`).toString('base64')}`,
        };
      },
    }),
  ],
  triggers: [],
});
