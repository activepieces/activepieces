import getDocument from './actions/get-document';
import deleteDocument from './actions/delete-document';
import query from './actions/query';
import insertDocument from './actions/insert-document';
import upsertDocument from './actions/upsert-document';

export default [
  insertDocument, upsertDocument, getDocument, deleteDocument, query
]
