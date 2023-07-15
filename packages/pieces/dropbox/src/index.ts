import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { dropboxCreateNewFolder } from './lib/actions/create-new-folder';
import { dropboxCreateNewTextFile } from './lib/actions/create-new-text-file';

export const dropboxAuth = PieceAuth.OAuth2({
  description: "",
  displayName: 'Authentication',
  authUrl: "https://www.dropbox.com/oauth2/authorize",
  tokenUrl: "https://api.dropboxapi.com/oauth2/token",
  required: true,
  scope: ["files.content.write"]
})

export const dropbox = createPiece({
      minimumSupportedRelease: '0.5.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/dropbox.png',
  actions: [dropboxCreateNewFolder, dropboxCreateNewTextFile],
  displayName: "DropBox",
  authors: ['kanarelo'],
  triggers: [],
  auth: dropboxAuth,
});
