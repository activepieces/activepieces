import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import {
  anonymizePerson,
  createEvent,
  createEventsBatch,
  createPurchase,
  createPurchasesBatch,
  findCoupon,
  findPerson,
  getLoyaltyRedeemActions,
  refund,
  unsubscribePerson,
  updatePerson,
  updateReferralStatus,
} from './lib/actions';

const markdownDescription = `
Follow these steps:

1. **Log in to your Talkable account:** Open Talkable https://www.talkable.com/login.

2. **Enter the Talkable site slug and API key:** Go to **All site Settings** > **API Settings**, and copy Site ID and API key.

`;

export const talkableAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    site: Property.ShortText({
      displayName: 'Talkable site ID',
      required: true,
    }),
    api_key: Property.ShortText({
      displayName: 'API key',
      required: true,
    }),
  },
  required: true,
});

export const talkable = createPiece({
  displayName: 'Talkable',
  description: 'Referral marketing programs that drive revenue',

  auth: talkableAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl:
    'https://www.talkable.com/wp-content/uploads/2021/12/talkable-favicon.svg',
  authors: ["Vitalini","kishanprmr","MoShizzle","abuaboud"],
  categories: [PieceCategory.MARKETING],
  actions: [
    findPerson,
    findCoupon,
    updatePerson,
    anonymizePerson,
    unsubscribePerson,
    createPurchase,
    createPurchasesBatch,
    createEvent,
    createEventsBatch,
    refund,
    getLoyaltyRedeemActions,
    updateReferralStatus,
    createCustomApiCallAction({
      baseUrl: () => 'https://www.talkable.com/api/v2',
      auth: talkableAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { api_key: string }).api_key}`,
      }),
    }),
  ],
  triggers: [],
});
