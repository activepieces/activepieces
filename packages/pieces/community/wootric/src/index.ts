import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createWootricSurvey } from './lib/actions/create-survey';
import { OAuth2GrantType } from '@activepieces/shared';

export const WOOTRIC_API_URL = 'https://api.wootric.com';
export const WOOTRIC_IMAGE_URL =
  'https://assets-production.wootric.com/assets/wootric-is-now-inmoment-250x108-85cb4900c62ff4d33200abafee7d63372d410abc5bf0cab90e80a07d4f4e5a31.png';

export const wootricAuth = PieceAuth.OAuth2({
  required: true,
  grantType: OAuth2GrantType.CLIENT_CREDENTIALS,
  authUrl: '',
  tokenUrl: `${WOOTRIC_API_URL}/oauth/token`,
  scope: [],
});

export const wootric = createPiece({
  displayName: 'Wootric',
  description: 'Measure and boost customer happiness',

  auth: wootricAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: WOOTRIC_IMAGE_URL,
  authors: ["abuaboud"],
  actions: [createWootricSurvey],
  triggers: [],
});
