import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { mongodbAuth } from './lib/auth';
import { findDocumentsAction } from './lib/actions/find-documents';
import { insertDocumentsAction } from './lib/actions/insert-documents';
import { updateDocumentsAction } from './lib/actions/update-documents';
import { deleteDocumentsAction } from './lib/actions/delete-documents';
import { findAndUpdateDocumentsAction } from './lib/actions/find-and-update-documents';
import { findAndReplaceDocumentsAction } from './lib/actions/find-and-replace-documents';
import { aggregateDocumentsAction } from './lib/actions/aggregate-documents';
import { mongodbAiActions } from './lib/actions/ai';

export const mongodb = createPiece({
  displayName: 'MongoDB',
  auth: mongodbAuth,
  minimumSupportedRelease: '0.88.2',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  logoUrl: 'https://cdn.activepieces.com/pieces/mongodb.png',
  authors: ['denieler'],
  actions: [
    findDocumentsAction,
    insertDocumentsAction,
    updateDocumentsAction,
    deleteDocumentsAction,
    findAndUpdateDocumentsAction,
    findAndReplaceDocumentsAction,
    aggregateDocumentsAction,
    ...mongodbAiActions,
  ],
  triggers: [],
});
