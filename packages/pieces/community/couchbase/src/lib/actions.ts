import insertDocument from './actions/insert-document';
import upsertDocument from './actions/upsert-document';
import getDocument from './actions/get-document';
import deleteDocument from './actions/delete-document';
import query from './actions/query';

export default [
  insertDocument,
  upsertDocument,
  getDocument,
  deleteDocument,
  query,
];
