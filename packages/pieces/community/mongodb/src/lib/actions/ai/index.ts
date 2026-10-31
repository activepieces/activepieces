import { aggregateDocumentsAiAction } from './aggregate-documents';
import { deleteDocumentsAiAction } from './delete-documents';
import { findAndReplaceDocumentAiAction } from './find-and-replace-document';
import { findAndUpdateDocumentsAiAction } from './find-and-update-documents';
import { findDocumentsAiAction } from './find-documents';
import { insertDocumentsAiAction } from './insert-documents';
import { updateDocumentsAiAction } from './update-documents';
import { countDocumentsAction } from './count-documents';
import { createCollectionAction } from './create-collection';
import { createIndexAction } from './create-index';
import { distinctValuesAction } from './distinct-values';
import { dropCollectionAction } from './drop-collection';
import { dropIndexAction } from './drop-index';
import { findOneDocumentAction } from './find-one-document';
import { listCollectionsAction } from './list-collections';
import { listDatabasesAction } from './list-databases';
import { listIndexesAction } from './list-indexes';

export const mongodbAiActions = [
  listDatabasesAction,
  listCollectionsAction,
  countDocumentsAction,
  distinctValuesAction,
  findDocumentsAiAction,
  findOneDocumentAction,
  insertDocumentsAiAction,
  updateDocumentsAiAction,
  findAndUpdateDocumentsAiAction,
  findAndReplaceDocumentAiAction,
  deleteDocumentsAiAction,
  aggregateDocumentsAiAction,
  createCollectionAction,
  dropCollectionAction,
  listIndexesAction,
  createIndexAction,
  dropIndexAction,
];
