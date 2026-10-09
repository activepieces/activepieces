import type { AppConnectionType } from '@activepieces/pieces-framework';

export type FlowiseAuthValue = {
	type: AppConnectionType.CUSTOM_AUTH;
	props: { base_url: string; access_token: string };
};

export type FlowisePrediction = {
	text?: string;
	question?: string;
	chatId?: string;
	chatMessageId?: string;
	sessionId?: string;
};

export type FlowiseChatflow = {
	id: string;
	name: string;
	flowData?: string;
	deployed?: boolean;
	isPublic?: boolean;
	category?: string;
	type?: string;
};

export type FlowiseChatMessage = {
	id: string;
	role: string;
	chatflowid: string;
	content: string;
	chatId: string;
	sessionId?: string;
};

export type FlowiseFeedback = {
	id: string;
	chatflowid: string;
	chatId: string;
	messageId: string;
	rating: string;
	content?: string;
};

export type FlowiseLead = {
	id: string;
	name?: string;
	email?: string;
	phone?: string;
	chatflowid: string;
	chatId: string;
};

export type FlowiseAssistant = {
	id: string;
	details: string;
	credential: string;
	iconSrc?: string;
	type?: string;
};

export type FlowiseTool = {
	id: string;
	name: string;
	description: string;
	color: string;
	iconSrc?: string;
	schema?: string;
	func?: string;
};

export type FlowiseVariable = {
	id: string;
	name: string;
	value?: string;
	type: string;
};

export type FlowiseDocumentStore = {
	id: string;
	name: string;
	description?: string;
	status?: string;
};

export type FlowiseDocumentChunks = {
	chunks: Record<string, unknown>[];
	count: number;
	currentPage: number;
};

export type FlowiseUpsertResult = {
	numAdded?: number;
	numDeleted?: number;
	numUpdated?: number;
	numSkipped?: number;
	addedDocs?: Record<string, unknown>[];
};

export type FlowiseQueryResult = {
	timeTaken?: number;
	docs?: Record<string, unknown>[];
};

export type FlowiseAttachment = {
	name: string;
	mimeType: string;
	size: number;
	content: string;
};

export type FlowiseFile = {
	filename: string;
	data: Buffer;
};
