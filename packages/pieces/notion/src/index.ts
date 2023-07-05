
import { createPiece } from '@activepieces/pieces-framework';
import { newDatabaseItem } from './lib/triggers/new-database-item';
import { updatedDatabaseItem } from './lib/triggers/updated-database-item';
import createDatabaseItem from './lib/actions/create-database-item';
import createPage from './lib/actions/create-page';
import updateDatabaseItem from './lib/actions/update-database-item';
import findDatabaseItem from './lib/actions/find-database-item';
import findPage from './lib/actions/find-page';

export const notion = createPiece({
  displayName: 'Notion',
  logoUrl: 'https://cdn.activepieces.com/pieces/notion.png',
  minimumSupportedRelease: '0.3.10',
  authors: [
    'ShayPunter', 'abuaboud', 'abdallah-alwarawreh'
  ],
  actions: [
    updateDatabaseItem,
    createDatabaseItem,
    findDatabaseItem,
    findPage,
    createPage
  ],
  triggers: [
    newDatabaseItem,
    updatedDatabaseItem
  ],
});
