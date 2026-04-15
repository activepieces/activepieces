import { PieceAuth } from '@activepieces/pieces-framework';
import { OAuth2GrantType } from '@activepieces/shared';

const WOOTRIC_API_URL = 'https://api.wootric.com';

export { WOOTRIC_API_URL };

export const wootricAuth = PieceAuth.OAuth2({
  required: true,
  grantType: OAuth2GrantType.CLIENT_CREDENTIALS,
  authUrl: '',
  tokenUrl: `${WOOTRIC_API_URL}/oauth/token`,
  scope: [],
});
