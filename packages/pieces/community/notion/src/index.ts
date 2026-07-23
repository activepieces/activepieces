import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { notionAuth } from './lib/auth';
import { getNotionToken, NotionAuthValue } from './lib/common';
import { appendToPage } from './lib/actions/append-to-page';
import { createDatabaseItem } from './lib/actions/create-database-item';
import { createPage } from './lib/actions/create-page';
import { updateDatabaseItem } from './lib/actions/update-database-item';
import { newDatabaseItem } from './lib/triggers/new-database-item';
import { updatedDatabaseItem } from './lib/triggers/updated-database-item';
import { newComment } from './lib/triggers/new-comment';
import { updatedPage } from './lib/triggers/updated-page';
import { findDatabaseItem } from './lib/actions/find-item';
import { getPageOrBlockChildren } from './lib/actions/get-page-or-block-children';
import { archiveDatabaseItem } from './lib/actions/archive-database-item';
import { restoreDatabaseItem } from './lib/actions/restore-database-item';
import { addComment } from './lib/actions/add-comment';
import { retrieveDatabase } from './lib/actions/retrieve-database';
import { getPageComments } from './lib/actions/get-page-comments';
import { findPage } from './lib/actions/find-page';
import { listDatabases } from './lib/actions/list-databases';
import { listDatabasePages } from './lib/actions/list-database-pages';

// Phase-3 audience:'ai' agent atomics (full Composio-parity agent surface)
import { notionCreatePage } from './lib/actions/notion-create-page';
import { notionGetPage } from './lib/actions/notion-get-page';
import { notionArchivePage } from './lib/actions/notion-archive-page';
import { notionMovePage } from './lib/actions/notion-move-page';
import { notionAppendToPage } from './lib/actions/notion-append-to-page';
import { notionGetBlockChildren } from './lib/actions/notion-get-block-children';
import { notionUpdateBlock } from './lib/actions/notion-update-block';
import { notionDeleteBlock } from './lib/actions/notion-delete-block';
import { notionAddComment } from './lib/actions/notion-add-comment';
import { notionGetPageComments } from './lib/actions/notion-get-page-comments';
import { notionSearch } from './lib/actions/notion-search';
import { notionListUsers } from './lib/actions/notion-list-users';
import { notionGetUser } from './lib/actions/notion-get-user';
import { notionGetDatabase } from './lib/actions/notion-get-database';
import { notionQueryDatabase } from './lib/actions/notion-query-database';
import { notionCreateDatabase } from './lib/actions/notion-create-database';
import { notionUpdateDatabaseSchema } from './lib/actions/notion-update-database-schema';
import { notionCreateDatabaseItem } from './lib/actions/notion-create-database-item';
import { notionUpdateDatabaseItem } from './lib/actions/notion-update-database-item';
import { notionFindDatabaseItem } from './lib/actions/notion-find-database-item';
import { notionArchiveDatabaseItem } from './lib/actions/notion-archive-database-item';
import { notionRestoreDatabaseItem } from './lib/actions/notion-restore-database-item';

export const notion = createPiece({
  displayName: 'Notion',
  description: 'The all-in-one workspace',
  logoUrl: 'https://cdn.activepieces.com/pieces/notion.png',
  categories: [PieceCategory.PRODUCTIVITY],
  minimumSupportedRelease: '0.30.0',
  authors: [
    'ShayPunter',
    'kishanprmr',
    'MoShizzle',
    'khaledmashaly',
    'abuaboud',
    'AdamSelene',
    'ezhil56x',
    'onyedikachi-david',
  ],
  auth: notionAuth,
  actions: [
    listDatabases,
    createDatabaseItem,
    updateDatabaseItem,
    findDatabaseItem,
    listDatabasePages,
    createPage,
    appendToPage,
    getPageOrBlockChildren,
    archiveDatabaseItem,
    restoreDatabaseItem,
    addComment,
    retrieveDatabase,
    getPageComments,
    findPage,
    // Phase-3 audience:'ai' agent atomics (full Composio-parity agent surface)
    notionCreatePage,
    notionGetPage,
    notionArchivePage,
    notionMovePage,
    notionAppendToPage,
    notionGetBlockChildren,
    notionUpdateBlock,
    notionDeleteBlock,
    notionAddComment,
    notionGetPageComments,
    notionSearch,
    notionListUsers,
    notionGetUser,
    notionGetDatabase,
    notionQueryDatabase,
    notionCreateDatabase,
    notionUpdateDatabaseSchema,
    notionCreateDatabaseItem,
    notionUpdateDatabaseItem,
    notionFindDatabaseItem,
    notionArchiveDatabaseItem,
    notionRestoreDatabaseItem,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.notion.com/v1',
      auth: notionAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${getNotionToken(auth as NotionAuthValue)}`,
      }),
    }),
  ],
  triggers: [newDatabaseItem, updatedDatabaseItem, newComment, updatedPage],
});
