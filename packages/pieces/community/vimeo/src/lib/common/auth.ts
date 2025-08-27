import { PieceAuth } from '@activepieces/pieces-framework';
import { OAuth2GrantType } from '@activepieces/shared';

export const vimeoAuth = PieceAuth.OAuth2({
    authUrl: 'https://api.vimeo.com/oauth/authorize',
    tokenUrl: 'https://api.vimeo.com/oauth/access_token',
    required: true,
    grantType: OAuth2GrantType.AUTHORIZATION_CODE,
    scope: ['public', 'private', 'edit', 'upload', 'delete'],
});
