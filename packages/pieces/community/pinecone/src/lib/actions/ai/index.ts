import { pineconeCancelImportAction } from './cancel-import';
import { pineconeChatCompletionWithAssistantAction } from './chat-completion-with-assistant';
import { pineconeChatWithAssistantAction } from './chat-with-assistant';
import { pineconeConfigureIndexAction } from './configure-index';
import { pineconeCreateAssistantAction } from './create-assistant';
import { pineconeCreateIndexAction } from './create-index';
import { pineconeCreateIndexForModelAction } from './create-index-for-model';
import { pineconeCreateNamespaceAction } from './create-namespace';
import { pineconeCreateNamespaceAliasAction } from './create-namespace-alias';
import { pineconeDeleteAssistantAction } from './delete-assistant';
import { pineconeDeleteAssistantFileAction } from './delete-assistant-file';
import { pineconeDeleteDocumentsAction } from './delete-documents';
import { pineconeDeleteIndexAction } from './delete-index';
import { pineconeDeleteNamespaceAction } from './delete-namespace';
import { pineconeDeleteNamespaceAliasAction } from './delete-namespace-alias';
import { pineconeDeleteVectorsAction } from './delete-vectors';
import { pineconeFetchDocumentsAction } from './fetch-documents';
import { pineconeFetchVectorsAction } from './fetch-vectors';
import { pineconeFetchVectorsByMetadataAction } from './fetch-vectors-by-metadata';
import { pineconeGenerateEmbeddingsAction } from './generate-embeddings';
import { pineconeGetAssistantAction } from './get-assistant';
import { pineconeGetAssistantFileAction } from './get-assistant-file';
import { pineconeGetAssistantOperationAction } from './get-assistant-operation';
import { pineconeGetImportAction } from './get-import';
import { pineconeGetIndexAction } from './get-index';
import { pineconeGetIndexStatsAction } from './get-index-stats';
import { pineconeGetModelAction } from './get-model';
import { pineconeGetNamespaceAction } from './get-namespace';
import { pineconeGetNamespaceAliasAction } from './get-namespace-alias';
import { pineconeListAssistantFilesAction } from './list-assistant-files';
import { pineconeListAssistantOperationsAction } from './list-assistant-operations';
import { pineconeListAssistantsAction } from './list-assistants';
import { pineconeListDocumentsAction } from './list-documents';
import { pineconeListImportsAction } from './list-imports';
import { pineconeListIndexesAction } from './list-indexes';
import { pineconeListModelsAction } from './list-models';
import { pineconeListNamespaceAliasesAction } from './list-namespace-aliases';
import { pineconeListNamespacesAction } from './list-namespaces';
import { pineconeListVectorIdsAction } from './list-vector-ids';
import { pineconeQueryVectorsAction } from './query-vectors';
import { pineconeReplaceAssistantFileAction } from './replace-assistant-file';
import { pineconeRepointNamespaceAliasAction } from './repoint-namespace-alias';
import { pineconeRerankDocumentsAction } from './rerank-documents';
import { pineconeRetrieveAssistantContextAction } from './retrieve-assistant-context';
import { pineconeSearchDocumentsAction } from './search-documents';
import { pineconeSearchTextRecordsAction } from './search-text-records';
import { pineconeStartImportAction } from './start-import';
import { pineconeUpdateAssistantAction } from './update-assistant';
import { pineconeUpdateDocumentsAction } from './update-documents';
import { pineconeUpdateVectorAction } from './update-vector';
import { pineconeUploadAssistantFileAction } from './upload-assistant-file';
import { pineconeUpsertDocumentsAction } from './upsert-documents';
import { pineconeUpsertTextRecordsAction } from './upsert-text-records';
import { pineconeUpsertVectorsAction } from './upsert-vectors';

export const pineconeAiActions = [
	pineconeListIndexesAction,
	pineconeGetIndexAction,
	pineconeCreateIndexAction,
	pineconeCreateIndexForModelAction,
	pineconeConfigureIndexAction,
	pineconeDeleteIndexAction,
	pineconeGetIndexStatsAction,
	pineconeUpsertVectorsAction,
	pineconeFetchVectorsAction,
	pineconeFetchVectorsByMetadataAction,
	pineconeListVectorIdsAction,
	pineconeUpdateVectorAction,
	pineconeDeleteVectorsAction,
	pineconeQueryVectorsAction,
	pineconeListNamespacesAction,
	pineconeCreateNamespaceAction,
	pineconeGetNamespaceAction,
	pineconeDeleteNamespaceAction,
	pineconeListNamespaceAliasesAction,
	pineconeCreateNamespaceAliasAction,
	pineconeGetNamespaceAliasAction,
	pineconeRepointNamespaceAliasAction,
	pineconeDeleteNamespaceAliasAction,
	pineconeUpsertDocumentsAction,
	pineconeFetchDocumentsAction,
	pineconeListDocumentsAction,
	pineconeSearchDocumentsAction,
	pineconeUpdateDocumentsAction,
	pineconeDeleteDocumentsAction,
	pineconeUpsertTextRecordsAction,
	pineconeSearchTextRecordsAction,
	pineconeStartImportAction,
	pineconeListImportsAction,
	pineconeGetImportAction,
	pineconeCancelImportAction,
	pineconeGenerateEmbeddingsAction,
	pineconeRerankDocumentsAction,
	pineconeListModelsAction,
	pineconeGetModelAction,
	pineconeListAssistantsAction,
	pineconeCreateAssistantAction,
	pineconeGetAssistantAction,
	pineconeUpdateAssistantAction,
	pineconeDeleteAssistantAction,
	pineconeChatWithAssistantAction,
	pineconeChatCompletionWithAssistantAction,
	pineconeRetrieveAssistantContextAction,
	pineconeListAssistantFilesAction,
	pineconeUploadAssistantFileAction,
	pineconeGetAssistantFileAction,
	pineconeReplaceAssistantFileAction,
	pineconeDeleteAssistantFileAction,
	pineconeListAssistantOperationsAction,
	pineconeGetAssistantOperationAction,
];
