import { createPiece } from '../../framework/piece';
import { dropboxCreateNewFolder } from './actions/create-new-folder';
import { dropboxCreateNewTextFile } from './actions/create-new-text-file';

export const dropbox = createPiece({
  name: 'dropbox',
  logoUrl: 'https://images.ctfassets.net/w7shgyvrfdaa/3IYfxopkdkgICWdFqyuk09/e58a653891958df31586ff9573ada73d/Dropbox_Tab_80.svg',
  actions: [dropboxCreateNewFolder, dropboxCreateNewTextFile],
  displayName: "DropBox",
  triggers: [],
});