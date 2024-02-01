import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

import { PieceCategory } from '@activepieces/shared';
import { newComment } from './lib/triggers/new-comment';
import { newFile } from './lib/triggers/new-file';
import { newFolder } from './lib/triggers/new-folder';

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
  categories: [PieceCategory.FILE_MANAGEMENT_AND_STORAGE],
  authors: ['kanarelo', 'MoShizzle'],
  actions: [],
  triggers: [newFile, newFolder, newComment],
});
