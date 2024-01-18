import {
  OAuth2AuthorizationMethod,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { newDatabaseItem } from './lib/triggers/new-database-item';
import { createDatabaseItem } from './lib/action/create-database-item';
import { updateDatabaseItem } from './lib/action/update-database-item';
import { appendToPage } from './lib/action/append-to-page';
import { createPage } from './lib/action/create-page';
import { updatedDatabaseItem } from './lib/triggers/updated-database-item';

export const notionAuth = PieceAuth.OAuth2({
  authUrl: 'https://api.notion.com/v1/oauth/authorize',
  tokenUrl: 'https://api.notion.com/v1/oauth/token',
  scope: [],
  extra: {
    owner: 'user',
  },
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
  required: true,
});

export const notion = createPiece({
  displayName: 'Notion',
  logoUrl: 'https://cdn.activepieces.com/pieces/notion.png',
  minimumSupportedRelease: '0.5.0',
  authors: ['ShayPunter', 'abuaboud', 'kishanprmr', 'MoShizzle'],
  auth: notionAuth,
  actions: [createDatabaseItem, updateDatabaseItem, createPage, appendToPage],
  triggers: [newDatabaseItem, updatedDatabaseItem],
});
