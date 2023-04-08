
import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { newDatabaseItem } from './lib/triggers/new-database-item';

export const notion = createPiece({
  name: 'notion',
  displayName: 'notion',
  logoUrl: 'https://cdn.activepieces.com/pieces/notion.png',
  version: packageJson.version,
  minimumSupportedRelease: '0.3.10',
  authors: [
    'ShayPunter', 'abuaboud'
  ],
  actions: [

  ],
  triggers: [
    newDatabaseItem
  ],
});
