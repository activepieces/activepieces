import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { dropboxCreateNewFolder } from './lib/actions/create-new-folder';
import { dropboxCreateNewTextFile } from './lib/actions/create-new-text-file';
import { dropboxUploadFile } from './lib/actions/upload-file';
import { dropboxDownloadFile } from './lib/actions/download-file';
import { dropboxDeleteFile } from './lib/actions/delete-file';
import { dropboxMoveFile } from './lib/actions/move-file';
import { copyFile } from 'fs';
import { dropboxCopyFile } from './lib/actions/copy-file';
import { DeleteFolderRequest } from '@activepieces/shared';
import { dropboxDeleteFolder } from './lib/actions/delete-folder';
import { dropboxMoveFolder } from './lib/actions/move-folder';
import { dropboxCopyFolder } from './lib/actions/copy-folder';
import { dropboxListAFolder } from './lib/actions/list-a-folder';

export const dropboxAuth = PieceAuth.OAuth2({
  description: "",

  authUrl: "https://www.dropbox.com/oauth2/authorize",
  tokenUrl: "https://api.dropboxapi.com/oauth2/token",
  required: true,
  scope: ["files.metadata.write", "files.metadata.read", "files.content.write", "files.content.read"]
})

export const dropbox = createPiece({
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/dropbox.png',
  actions: [dropboxCreateNewFolder, dropboxCreateNewTextFile, dropboxUploadFile,
    dropboxDownloadFile, dropboxDeleteFile, dropboxMoveFile, dropboxCopyFile, dropboxDeleteFolder, dropboxMoveFolder, dropboxCopyFolder, dropboxListAFolder],
  displayName: "DropBox",
  authors: ['kanarelo'],
  triggers: [],
  auth: dropboxAuth,
});
