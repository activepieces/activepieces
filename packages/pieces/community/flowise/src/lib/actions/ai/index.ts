import { createAssistantAction } from './create-assistant';
import { createAttachmentsAction } from './create-attachments';
import { createChatflowAction } from './create-chatflow';
import { createDocumentStoreAction } from './create-document-store';
import { createFeedbackAction } from './create-feedback';
import { createLeadAction } from './create-lead';
import { createToolAction } from './create-tool';
import { createVariableAction } from './create-variable';
import { deleteAssistantAction } from './delete-assistant';
import { deleteChatMessagesAction } from './delete-chat-messages';
import { deleteChatflowAction } from './delete-chatflow';
import { deleteDocumentChunkAction } from './delete-document-chunk';
import { deleteDocumentLoaderAction } from './delete-document-loader';
import { deleteDocumentStoreAction } from './delete-document-store';
import { deleteToolAction } from './delete-tool';
import { deleteVariableAction } from './delete-variable';
import { deleteVectorStoreDataAction } from './delete-vector-store-data';
import { getAssistantAction } from './get-assistant';
import { getChatflowAction } from './get-chatflow';
import { getDocumentChunksAction } from './get-document-chunks';
import { getDocumentStoreAction } from './get-document-store';
import { getToolAction } from './get-tool';
import { listAssistantsAction } from './list-assistants';
import { listChatMessagesAction } from './list-chat-messages';
import { listChatflowsAction } from './list-chatflows';
import { listDocumentStoresAction } from './list-document-stores';
import { listFeedbackAction } from './list-feedback';
import { listLeadsAction } from './list-leads';
import { listToolsAction } from './list-tools';
import { listVariablesAction } from './list-variables';
import { queryDocumentStoreAction } from './query-document-store';
import { refreshDocumentStoreAction } from './refresh-document-store';
import { updateAssistantAction } from './update-assistant';
import { updateChatflowAction } from './update-chatflow';
import { updateDocumentChunkAction } from './update-document-chunk';
import { updateDocumentStoreAction } from './update-document-store';
import { updateFeedbackAction } from './update-feedback';
import { updateToolAction } from './update-tool';
import { updateVariableAction } from './update-variable';
import { upsertDocumentAction } from './upsert-document';

export const flowiseAiActions = [
	createAssistantAction,
	createAttachmentsAction,
	createChatflowAction,
	createDocumentStoreAction,
	createFeedbackAction,
	createLeadAction,
	createToolAction,
	createVariableAction,
	deleteAssistantAction,
	deleteChatMessagesAction,
	deleteChatflowAction,
	deleteDocumentChunkAction,
	deleteDocumentLoaderAction,
	deleteDocumentStoreAction,
	deleteToolAction,
	deleteVariableAction,
	deleteVectorStoreDataAction,
	getAssistantAction,
	getChatflowAction,
	getDocumentChunksAction,
	getDocumentStoreAction,
	getToolAction,
	listAssistantsAction,
	listChatMessagesAction,
	listChatflowsAction,
	listDocumentStoresAction,
	listFeedbackAction,
	listLeadsAction,
	listToolsAction,
	listVariablesAction,
	queryDocumentStoreAction,
	refreshDocumentStoreAction,
	updateAssistantAction,
	updateChatflowAction,
	updateDocumentChunkAction,
	updateDocumentStoreAction,
	updateFeedbackAction,
	updateToolAction,
	updateVariableAction,
	upsertDocumentAction,
];
