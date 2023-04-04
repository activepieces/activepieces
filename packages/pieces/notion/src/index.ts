
import { createPiece } from '@activepieces/framework';
import packageJson from '../package.json';
import { newDatabaseItem } from './lib/triggers/new-database-item';

export const notion = createPiece({
  name: 'notion',
  displayName: 'notion',
  logoUrl: 'https://cdn.activepieces.com/pieces/notion.png',
  version: packageJson.version,
  authors: [
    'Shay Punter', 'abuaboud'
  ],
  actions: [

  ],
  triggers: [
    newDatabaseItem
  ],
});
