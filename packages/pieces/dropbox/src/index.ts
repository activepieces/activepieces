import packageJson from '../package.json';
import { createPiece } from '@activepieces/framework';
import { dropboxCreateNewFolder } from './lib/actions/create-new-folder';
import { dropboxCreateNewTextFile } from './lib/actions/create-new-text-file';

export const dropbox = createPiece({
  name: 'dropbox',
  logoUrl: 'https://cdn.activepieces.com/pieces/dropbox.png',
  actions: [dropboxCreateNewFolder, dropboxCreateNewTextFile],
  displayName: "DropBox",
  authors: ['kanarelo'],
  triggers: [],
  version: packageJson.version,
});
