import aggregateDocuments from './actions/aggregate-documents'
import deleteDocuments from './actions/delete-documents'
import findAndReplaceDocuments from './actions/find-and-replace-documents'
import findAndUpdateDocuments from './actions/find-and-update-documents'
import findDocuments from './actions/find-documents'
import insertDocuments from './actions/insert-documents'
import updateDocuments from './actions/update-documents'

export default [
    findDocuments,
    insertDocuments,
    updateDocuments,
    deleteDocuments,
    findAndUpdateDocuments,
    findAndReplaceDocuments,
    aggregateDocuments,
]
