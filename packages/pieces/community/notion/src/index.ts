import {
  OAuth2AuthorizationMethod,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { appendToPage } from './lib/action/append-to-page';
import { createDatabaseItem } from './lib/action/create-database-item';
import { createPage } from './lib/action/create-page';
import { updateDatabaseItem } from './lib/action/update-database-item';
import { newDatabaseItem } from './lib/triggers/new-database-item';
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
  categories: [PieceCategory.PROJECT_MANAGEMENT],
  auth: notionAuth,
  actions: [createDatabaseItem, updateDatabaseItem, createPage, appendToPage],
  triggers: [newDatabaseItem, updatedDatabaseItem],
});
