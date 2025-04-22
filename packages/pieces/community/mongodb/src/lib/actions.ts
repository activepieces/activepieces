import findDocuments from './actions/find-documents';
import insertDocuments from './actions/insert-documents';
import updateDocuments from './actions/update-documents';
import deleteDocuments from './actions/delete-documents';
import findAndUpdateDocuments from './actions/find-and-update-documents';
import findAndReplaceDocuments from './actions/find-and-replace-documents';
import aggregateDocuments from './actions/aggregate-documents';

export default [
  findDocuments,
  insertDocuments,
  updateDocuments,
  deleteDocuments,
  findAndUpdateDocuments,
  findAndReplaceDocuments,
  aggregateDocuments,
];
