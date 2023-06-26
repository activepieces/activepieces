
import { createPiece } from '@activepieces/pieces-framework';
import { newDatabaseItem } from './lib/triggers/new-database-item';

export const notion = createPiece({
  displayName: 'Notion',
  logoUrl: 'https://cdn.activepieces.com/pieces/notion.png',
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
