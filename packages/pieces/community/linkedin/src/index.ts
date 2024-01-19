import { PieceAuth, createPiece } from '@activepieces/pieces-framework';

import { createShareUpdate } from './lib/actions/create-share-update';
import { createCompanyUpdate } from './lib/actions/create-company-update';

export const linkedinAuth = PieceAuth.OAuth2({
  authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
  required: true,
  scope: [
    'w_member_social',
    'w_organization_social',
    'rw_organization_admin',
    'openid',
    'email',
    'profile',
  ],
});

export const linkedin = createPiece({
  displayName: 'LinkedIn',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/linkedin.png',
  authors: ['MoShizzle'],
  auth: linkedinAuth,
  actions: [createShareUpdate, createCompanyUpdate],
  triggers: [],
});
