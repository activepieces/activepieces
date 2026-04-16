import deleteDocument from './actions/delete-document'
import getDocument from './actions/get-document'
import insertDocument from './actions/insert-document'
import query from './actions/query'
import upsertDocument from './actions/upsert-document'

export default [insertDocument, upsertDocument, getDocument, deleteDocument, query]
