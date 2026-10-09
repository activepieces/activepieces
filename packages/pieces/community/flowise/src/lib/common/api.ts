import { randomUUID } from 'node:crypto';

import FormData from 'form-data';

import { HttpMethod } from '@activepieces/pieces-common';

import { flowiseClient } from './client';

import type {
	FlowiseAssistant,
	FlowiseAttachment,
	FlowiseAuthValue,
	FlowiseChatflow,
	FlowiseChatMessage,
	FlowiseDocumentChunks,
	FlowiseDocumentStore,
	FlowiseFeedback,
	FlowiseFile,
	FlowiseLead,
	FlowisePrediction,
	FlowiseQueryResult,
	FlowiseTool,
	FlowiseUpsertResult,
	FlowiseVariable,
} from './types';

async function createPrediction({
	auth,
	chatflowId,
	question,
	history,
	overrideConfig,
}: CreatePredictionParams & { auth: FlowiseAuthValue }): Promise<FlowisePrediction> {
	return await flowiseClient.request<FlowisePrediction>({
		auth,
		method: HttpMethod.POST,
		path: `/api/v1/prediction/${chatflowId}`,
		headers: { 'Content-Type': 'application/json' },
		body: { question, history, overrideConfig },
	});
}

async function listChatflows({ auth }: { auth: FlowiseAuthValue }): Promise<FlowiseChatflow[]> {
	return await flowiseClient.request<FlowiseChatflow[]>({
		auth,
		method: HttpMethod.GET,
		path: '/api/v1/chatflows',
	});
}

async function getChatflow({
	auth,
	chatflowId,
}: {
	auth: FlowiseAuthValue;
	chatflowId: string;
}): Promise<FlowiseChatflow> {
	return await flowiseClient.request<FlowiseChatflow>({
		auth,
		method: HttpMethod.GET,
		path: `/api/v1/chatflows/${chatflowId}`,
	});
}

async function createChatflow({
	auth,
	fields,
}: {
	auth: FlowiseAuthValue;
	fields: ChatflowFields;
}): Promise<FlowiseChatflow> {
	return await flowiseClient.request<FlowiseChatflow>({
		auth,
		method: HttpMethod.POST,
		path: '/api/v1/chatflows',
		body: fields,
	});
}

async function updateChatflow({
	auth,
	chatflowId,
	fields,
}: {
	auth: FlowiseAuthValue;
	chatflowId: string;
	fields: Partial<ChatflowFields>;
}): Promise<FlowiseChatflow> {
	return await flowiseClient.request<FlowiseChatflow>({
		auth,
		method: HttpMethod.PUT,
		path: `/api/v1/chatflows/${chatflowId}`,
		body: fields,
	});
}

async function deleteChatflow({
	auth,
	chatflowId,
}: {
	auth: FlowiseAuthValue;
	chatflowId: string;
}): Promise<unknown> {
	return await flowiseClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/api/v1/chatflows/${chatflowId}`,
	});
}

async function listChatMessages({
	auth,
	chatflowId,
	filters,
}: {
	auth: FlowiseAuthValue;
	chatflowId: string;
	filters: Record<string, string | undefined>;
}): Promise<FlowiseChatMessage[]> {
	return await flowiseClient.request<FlowiseChatMessage[]>({
		auth,
		method: HttpMethod.GET,
		path: `/api/v1/chatmessage/${chatflowId}`,
		query: filters,
	});
}

async function deleteChatMessages({
	auth,
	chatflowId,
	filters,
}: {
	auth: FlowiseAuthValue;
	chatflowId: string;
	filters: Record<string, string | undefined>;
}): Promise<unknown> {
	return await flowiseClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/api/v1/chatmessage/${chatflowId}`,
		query: filters,
	});
}

async function listFeedback({
	auth,
	chatflowId,
	filters,
}: {
	auth: FlowiseAuthValue;
	chatflowId: string;
	filters: Record<string, string | undefined>;
}): Promise<FlowiseFeedback[]> {
	return await flowiseClient.request<FlowiseFeedback[]>({
		auth,
		method: HttpMethod.GET,
		path: `/api/v1/feedback/${chatflowId}`,
		query: filters,
	});
}

async function createFeedback({
	auth,
	fields,
}: {
	auth: FlowiseAuthValue;
	fields: FeedbackFields;
}): Promise<FlowiseFeedback> {
	return await flowiseClient.request<FlowiseFeedback>({
		auth,
		method: HttpMethod.POST,
		path: '/api/v1/feedback',
		body: fields,
	});
}

async function updateFeedback({
	auth,
	feedbackId,
	fields,
}: {
	auth: FlowiseAuthValue;
	feedbackId: string;
	fields: Partial<FeedbackFields>;
}): Promise<FlowiseFeedback> {
	return await flowiseClient.request<FlowiseFeedback>({
		auth,
		method: HttpMethod.PUT,
		path: `/api/v1/feedback/${feedbackId}`,
		body: fields,
	});
}

async function listLeads({
	auth,
	chatflowId,
}: {
	auth: FlowiseAuthValue;
	chatflowId: string;
}): Promise<FlowiseLead[]> {
	return await flowiseClient.request<FlowiseLead[]>({
		auth,
		method: HttpMethod.GET,
		path: `/api/v1/leads/${chatflowId}`,
	});
}

async function createLead({
	auth,
	fields,
}: {
	auth: FlowiseAuthValue;
	fields: LeadFields;
}): Promise<FlowiseLead> {
	return await flowiseClient.request<FlowiseLead>({
		auth,
		method: HttpMethod.POST,
		path: '/api/v1/leads',
		body: fields,
	});
}

async function listAssistants({
	auth,
	type,
}: {
	auth: FlowiseAuthValue;
	type?: string;
}): Promise<FlowiseAssistant[]> {
	return await flowiseClient.request<FlowiseAssistant[]>({
		auth,
		method: HttpMethod.GET,
		path: '/api/v1/assistants',
		query: { type },
	});
}

async function getAssistant({
	auth,
	assistantId,
}: {
	auth: FlowiseAuthValue;
	assistantId: string;
}): Promise<FlowiseAssistant> {
	return await flowiseClient.request<FlowiseAssistant>({
		auth,
		method: HttpMethod.GET,
		path: `/api/v1/assistants/${assistantId}`,
	});
}

async function createAssistant({
	auth,
	type,
	details,
	credential,
	iconSrc,
}: AssistantFields & { auth: FlowiseAuthValue }): Promise<FlowiseAssistant> {
	return await flowiseClient.request<FlowiseAssistant>({
		auth,
		method: HttpMethod.POST,
		path: '/api/v1/assistants',
		body: {
			type,
			details: JSON.stringify(details),
			credential: credential ?? (type === 'CUSTOM' ? randomUUID() : undefined),
			iconSrc,
		},
	});
}

async function updateAssistant({
	auth,
	assistantId,
	details,
	credential,
	iconSrc,
}: Partial<AssistantFields> & {
	auth: FlowiseAuthValue;
	assistantId: string;
}): Promise<FlowiseAssistant> {
	return await flowiseClient.request<FlowiseAssistant>({
		auth,
		method: HttpMethod.PUT,
		path: `/api/v1/assistants/${assistantId}`,
		body: {
			details: details === undefined ? undefined : JSON.stringify(details),
			credential,
			iconSrc,
		},
	});
}

async function deleteAssistant({
	auth,
	assistantId,
	isDeleteBoth,
}: {
	auth: FlowiseAuthValue;
	assistantId: string;
	isDeleteBoth?: boolean;
}): Promise<unknown> {
	return await flowiseClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/api/v1/assistants/${assistantId}`,
		query: { isDeleteBoth: isDeleteBoth ? 'true' : undefined },
	});
}

async function listTools({ auth }: { auth: FlowiseAuthValue }): Promise<FlowiseTool[]> {
	return await flowiseClient.request<FlowiseTool[]>({
		auth,
		method: HttpMethod.GET,
		path: '/api/v1/tools',
	});
}

async function getTool({
	auth,
	toolId,
}: {
	auth: FlowiseAuthValue;
	toolId: string;
}): Promise<FlowiseTool> {
	return await flowiseClient.request<FlowiseTool>({
		auth,
		method: HttpMethod.GET,
		path: `/api/v1/tools/${toolId}`,
	});
}

async function createTool({
	auth,
	fields,
}: {
	auth: FlowiseAuthValue;
	fields: ToolFields;
}): Promise<FlowiseTool> {
	return await flowiseClient.request<FlowiseTool>({
		auth,
		method: HttpMethod.POST,
		path: '/api/v1/tools',
		body: fields,
	});
}

async function updateTool({
	auth,
	toolId,
	fields,
}: {
	auth: FlowiseAuthValue;
	toolId: string;
	fields: Partial<ToolFields>;
}): Promise<FlowiseTool> {
	return await flowiseClient.request<FlowiseTool>({
		auth,
		method: HttpMethod.PUT,
		path: `/api/v1/tools/${toolId}`,
		body: fields,
	});
}

async function deleteTool({
	auth,
	toolId,
}: {
	auth: FlowiseAuthValue;
	toolId: string;
}): Promise<unknown> {
	return await flowiseClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/api/v1/tools/${toolId}`,
	});
}

async function listVariables({ auth }: { auth: FlowiseAuthValue }): Promise<FlowiseVariable[]> {
	return await flowiseClient.request<FlowiseVariable[]>({
		auth,
		method: HttpMethod.GET,
		path: '/api/v1/variables',
	});
}

async function createVariable({
	auth,
	fields,
}: {
	auth: FlowiseAuthValue;
	fields: VariableFields;
}): Promise<FlowiseVariable> {
	return await flowiseClient.request<FlowiseVariable>({
		auth,
		method: HttpMethod.POST,
		path: '/api/v1/variables',
		body: fields,
	});
}

async function updateVariable({
	auth,
	variableId,
	fields,
}: {
	auth: FlowiseAuthValue;
	variableId: string;
	fields: Partial<VariableFields>;
}): Promise<FlowiseVariable> {
	return await flowiseClient.request<FlowiseVariable>({
		auth,
		method: HttpMethod.PUT,
		path: `/api/v1/variables/${variableId}`,
		body: fields,
	});
}

async function deleteVariable({
	auth,
	variableId,
}: {
	auth: FlowiseAuthValue;
	variableId: string;
}): Promise<unknown> {
	return await flowiseClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/api/v1/variables/${variableId}`,
	});
}

async function listDocumentStores({
	auth,
}: {
	auth: FlowiseAuthValue;
}): Promise<FlowiseDocumentStore[]> {
	return await flowiseClient.request<FlowiseDocumentStore[]>({
		auth,
		method: HttpMethod.GET,
		path: '/api/v1/document-store/store',
	});
}

async function getDocumentStore({
	auth,
	storeId,
}: {
	auth: FlowiseAuthValue;
	storeId: string;
}): Promise<FlowiseDocumentStore> {
	return await flowiseClient.request<FlowiseDocumentStore>({
		auth,
		method: HttpMethod.GET,
		path: `/api/v1/document-store/store/${storeId}`,
	});
}

async function createDocumentStore({
	auth,
	fields,
}: {
	auth: FlowiseAuthValue;
	fields: DocumentStoreFields;
}): Promise<FlowiseDocumentStore> {
	return await flowiseClient.request<FlowiseDocumentStore>({
		auth,
		method: HttpMethod.POST,
		path: '/api/v1/document-store/store',
		body: fields,
	});
}

async function updateDocumentStore({
	auth,
	storeId,
	fields,
}: {
	auth: FlowiseAuthValue;
	storeId: string;
	fields: Partial<DocumentStoreFields>;
}): Promise<FlowiseDocumentStore> {
	return await flowiseClient.request<FlowiseDocumentStore>({
		auth,
		method: HttpMethod.PUT,
		path: `/api/v1/document-store/store/${storeId}`,
		body: fields,
	});
}

async function deleteDocumentStore({
	auth,
	storeId,
}: {
	auth: FlowiseAuthValue;
	storeId: string;
}): Promise<unknown> {
	return await flowiseClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/api/v1/document-store/store/${storeId}`,
	});
}

async function getDocumentChunks({
	auth,
	storeId,
	loaderId,
	pageNo,
}: {
	auth: FlowiseAuthValue;
	storeId: string;
	loaderId: string;
	pageNo: number;
}): Promise<FlowiseDocumentChunks> {
	return await flowiseClient.request<FlowiseDocumentChunks>({
		auth,
		method: HttpMethod.GET,
		path: `/api/v1/document-store/chunks/${storeId}/${loaderId}/${pageNo}`,
	});
}

async function updateDocumentChunk({
	auth,
	storeId,
	loaderId,
	chunkId,
	pageContent,
	metadata,
}: ChunkParams & {
	auth: FlowiseAuthValue;
	pageContent: string;
	metadata?: Record<string, unknown>;
}): Promise<FlowiseDocumentChunks> {
	return await flowiseClient.request<FlowiseDocumentChunks>({
		auth,
		method: HttpMethod.PUT,
		path: `/api/v1/document-store/chunks/${storeId}/${loaderId}/${chunkId}`,
		body: { pageContent, metadata },
	});
}

async function deleteDocumentChunk({
	auth,
	storeId,
	loaderId,
	chunkId,
}: ChunkParams & { auth: FlowiseAuthValue }): Promise<unknown> {
	return await flowiseClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/api/v1/document-store/chunks/${storeId}/${loaderId}/${chunkId}`,
	});
}

async function deleteDocumentLoader({
	auth,
	storeId,
	loaderId,
}: {
	auth: FlowiseAuthValue;
	storeId: string;
	loaderId: string;
}): Promise<unknown> {
	return await flowiseClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/api/v1/document-store/loader/${storeId}/${loaderId}`,
	});
}

async function upsertDocument({
	auth,
	storeId,
	fields,
}: {
	auth: FlowiseAuthValue;
	storeId: string;
	fields: Record<string, unknown>;
}): Promise<FlowiseUpsertResult> {
	return await flowiseClient.request<FlowiseUpsertResult>({
		auth,
		method: HttpMethod.POST,
		path: `/api/v1/document-store/upsert/${storeId}`,
		body: fields,
	});
}

async function refreshDocumentStore({
	auth,
	storeId,
	items,
}: {
	auth: FlowiseAuthValue;
	storeId: string;
	items?: unknown;
}): Promise<FlowiseUpsertResult[]> {
	return await flowiseClient.request<FlowiseUpsertResult[]>({
		auth,
		method: HttpMethod.POST,
		path: `/api/v1/document-store/refresh/${storeId}`,
		body: { items },
	});
}

async function queryDocumentStore({
	auth,
	storeId,
	query,
}: {
	auth: FlowiseAuthValue;
	storeId: string;
	query: string;
}): Promise<FlowiseQueryResult> {
	return await flowiseClient.request<FlowiseQueryResult>({
		auth,
		method: HttpMethod.POST,
		path: '/api/v1/document-store/vectorstore/query',
		body: { storeId, query },
	});
}

async function deleteVectorStoreData({
	auth,
	storeId,
}: {
	auth: FlowiseAuthValue;
	storeId: string;
}): Promise<unknown> {
	return await flowiseClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/api/v1/document-store/vectorstore/${storeId}`,
	});
}

async function createAttachments({
	auth,
	chatflowId,
	chatId,
	file,
	base64,
}: {
	auth: FlowiseAuthValue;
	chatflowId: string;
	chatId: string;
	file: FlowiseFile;
	base64?: boolean;
}): Promise<FlowiseAttachment[]> {
	const form = new FormData();
	form.append('files', file.data, { filename: file.filename });
	if (base64 !== undefined) {
		form.append('base64', String(base64));
	}
	return await flowiseClient.request<FlowiseAttachment[]>({
		auth,
		method: HttpMethod.POST,
		path: `/api/v1/attachments/${chatflowId}/${chatId}`,
		headers: form.getHeaders(),
		body: form,
	});
}

export const flowiseApi = {
	createPrediction,
	listChatflows,
	getChatflow,
	createChatflow,
	updateChatflow,
	deleteChatflow,
	listChatMessages,
	deleteChatMessages,
	listFeedback,
	createFeedback,
	updateFeedback,
	listLeads,
	createLead,
	listAssistants,
	getAssistant,
	createAssistant,
	updateAssistant,
	deleteAssistant,
	listTools,
	getTool,
	createTool,
	updateTool,
	deleteTool,
	listVariables,
	createVariable,
	updateVariable,
	deleteVariable,
	listDocumentStores,
	getDocumentStore,
	createDocumentStore,
	updateDocumentStore,
	deleteDocumentStore,
	getDocumentChunks,
	updateDocumentChunk,
	deleteDocumentChunk,
	deleteDocumentLoader,
	upsertDocument,
	refreshDocumentStore,
	queryDocumentStore,
	deleteVectorStoreData,
	createAttachments,
};

type CreatePredictionParams = {
	chatflowId: string;
	question: string;
	history?: unknown;
	overrideConfig?: unknown;
};

type ChatflowFields = {
	name: string;
	flowData?: string;
	type?: string;
	deployed?: boolean;
	isPublic?: boolean;
	category?: string;
};

type FeedbackFields = {
	chatflowid: string;
	chatId: string;
	messageId: string;
	rating: string;
	content?: string;
};

type LeadFields = {
	chatflowid: string;
	chatId?: string;
	name?: string;
	email?: string;
	phone?: string;
};

type AssistantFields = {
	type: string;
	details: Record<string, unknown>;
	credential?: string;
	iconSrc?: string;
};

type ToolFields = {
	name: string;
	description: string;
	color: string;
	iconSrc?: string;
	schema?: string;
	func?: string;
};

type VariableFields = {
	name: string;
	value?: string;
	type?: string;
};

type DocumentStoreFields = {
	name: string;
	description?: string;
};

type ChunkParams = {
	storeId: string;
	loaderId: string;
	chunkId: string;
};
