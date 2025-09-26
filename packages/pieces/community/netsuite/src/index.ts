import {
  PieceAuth,
  createPiece,
  Property,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { getVendor } from './lib/actions/get-vendor';
import { getCustomer } from './lib/actions/get-customer';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createOAuthHeader } from './lib/oauth';

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
  displayName: 'NetSuite',
  logoUrl: 'https://cdn.activepieces.com/pieces/netsuite.png',
  categories: [PieceCategory.SALES_AND_CRM],
  auth: netsuiteAuth,
  authors: ['geekyme'],
  actions: [
    getVendor,
    getCustomer,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        const authValue = auth as PiecePropValueSchema<typeof netsuiteAuth>;
        return `https://${authValue.accountId}.suitetalk.api.netsuite.com`;
      },
      auth: netsuiteAuth,
      authMapping: async (auth, propsValue) => {
        const authValue = auth as PiecePropValueSchema<typeof netsuiteAuth>;

        const authHeader = createOAuthHeader(
          authValue.accountId,
          authValue.consumerKey,
          authValue.consumerSecret,
          authValue.tokenId,
          authValue.tokenSecret,
          propsValue['url'],
          propsValue['method']
        );

        return {
          Authorization: authHeader,
          prefer: 'transient',
          Cookie: 'NS_ROUTING_VERSION=LAGGING',
        };
      },
    }),
  ],
  triggers: [],
});
