
    import { createPiece } from '@activepieces/framework';
    import packageJson from '../package.json';
import { notionCreateDatabasePage } from './lib/actions/create-database-page';

    export const notion = createPiece({
      name: 'notion',
      displayName: 'notion',
      logoUrl: 'https://cdn.activepieces.com/pieces/notion.png',
      version: packageJson.version,
      authors: [
        'Shay Punter'
      ],
      actions: [
        notionCreateDatabasePage
      ],
      triggers: [
      ],
    });
  