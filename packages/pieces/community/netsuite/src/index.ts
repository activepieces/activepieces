import { PieceAuth, createPiece, Property } from '@activepieces/pieces-framework';
import { getVendor } from './lib/actions/get-vendor';
import { getCustomer } from './lib/actions/get-customer';

export const netsuiteAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
      description: 'Your NetSuite account ID',
    }),
    consumerKey: Property.ShortText({
      displayName: 'Consumer Key',
      required: true,
      description: 'Your NetSuite consumer key',
    }),
    consumerSecret: PieceAuth.SecretText({
      displayName: 'Consumer Secret',
      required: true,
      description: 'Your NetSuite consumer secret',
    }),
    tokenId: Property.ShortText({
      displayName: 'Token ID',
      required: true,
      description: 'Your NetSuite token ID',
    }),
    tokenSecret: PieceAuth.SecretText({
      displayName: 'Token Secret',
      required: true,
      description: 'Your NetSuite token secret',
    }),
  },
});

export const netsuite = createPiece({
  displayName: 'Netsuite',
  logoUrl: 'https://cdn.activepieces.com/pieces/netsuite.png',
  auth: netsuiteAuth,
  authors: [],
  actions: [getVendor, getCustomer],
  triggers: [],
});