import {
  createPiece,
  PieceAuth,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import {
  AuthenticationType,
  httpClient,
  HttpMethod, createCustomApiCallAction 

} from '@activepieces/pieces-common';
import { createOrUpdateSubscriberAction } from './lib/actions/create-or-update-subscriber.action';
import { getSubscriberAction } from './lib/actions/get-subscriber.action';
import { smailyAuth } from './lib/auth';

export const smaily = createPiece({
  displayName: 'Smaily',
  auth: smailyAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/smaily.png',
  categories: [PieceCategory.MARKETING],
  authors: ['kishanprmr'],
  actions: [createOrUpdateSubscriberAction, getSubscriberAction,
    createCustomApiCallAction({
      auth:smailyAuth,
      baseUrl: (auth)=>{
        if (!auth) {
          return '';
        }
        return `https://${auth.props.domain}.sendsmaily.net/api`
      },
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(
          `${auth.props.username}:${
            auth.props.password
          }`
        ).toString('base64')}`,
      }),
    })
  ],
  triggers: [],
});
