import { createPiece, OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework';

import { newComment } from './lib/triggers/new-comment';
import { newFile } from './lib/triggers/new-file';
import { newFolder } from './lib/triggers/new-folder';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { common } from './lib/common';

export const boxAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://account.box.com/api/oauth2/authorize',
  tokenUrl: 'https://api.box.com/oauth2/token',
  scope: ['manage_webhook', 'root_readonly', 'root_readwrite'],
});

export const box = createPiece({
  displayName: 'Box',
  auth: boxAuth,
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/box.png',
  authors: ['kanarelo', 'MoShizzle'],
  actions: [
    createCustomApiCallAction({
        baseUrl: () => common.baseUrl,
        auth: boxAuth,
        authMapping: (auth) => ({
          'Authorization': `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        })
      })
  ],
  triggers: [newFile, newFolder, newComment],
});
