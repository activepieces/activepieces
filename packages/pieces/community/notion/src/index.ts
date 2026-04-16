import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addComment } from './lib/actions/add-comment'
import { appendToPage } from './lib/actions/append-to-page'
import { archiveDatabaseItem } from './lib/actions/archive-database-item'
import { createDatabaseItem } from './lib/actions/create-database-item'
import { createPage } from './lib/actions/create-page'
import { findDatabaseItem } from './lib/actions/find-item'
import { findPage } from './lib/actions/find-page'
import { getPageComments } from './lib/actions/get-page-comments'
import { getPageOrBlockChildren } from './lib/actions/get-page-or-block-children'
import { restoreDatabaseItem } from './lib/actions/restore-database-item'
import { retrieveDatabase } from './lib/actions/retrieve-database'
import { updateDatabaseItem } from './lib/actions/update-database-item'
import { notionAuth } from './lib/auth'
import { getNotionToken, NotionAuthValue } from './lib/common'
import { newComment } from './lib/triggers/new-comment'
import { newDatabaseItem } from './lib/triggers/new-database-item'
import { updatedDatabaseItem } from './lib/triggers/updated-database-item'
import { updatedPage } from './lib/triggers/updated-page'

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
        createDatabaseItem,
        updateDatabaseItem,
        findDatabaseItem,
        createPage,
        appendToPage,
        getPageOrBlockChildren,
        archiveDatabaseItem,
        restoreDatabaseItem,
        addComment,
        retrieveDatabase,
        getPageComments,
        findPage,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.notion.com/v1',
            auth: notionAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${getNotionToken(auth as NotionAuthValue)}`,
            }),
        }),
    ],
    triggers: [newDatabaseItem, updatedDatabaseItem, newComment, updatedPage],
})
