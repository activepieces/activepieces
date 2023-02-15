import { createPiece } from '../../framework/piece';
import { dropboxCreateNewFolder } from './actions/create-new-folder';
import { dropboxCreateNewTextFile } from './actions/create-new-text-file';

export const dropbox = createPiece({
  name: 'dropbox',
  logoUrl: 'https://cdn.activepieces.com/pieces/dropbox.png',
  actions: [dropboxCreateNewFolder, dropboxCreateNewTextFile],
  displayName: "DropBox",
  authors: ['kanarelo'],
  triggers: [],
});