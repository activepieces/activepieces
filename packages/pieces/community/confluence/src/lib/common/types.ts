import type { AppConnectionType } from '@activepieces/pieces-framework';

export type ConfluenceAuthValue = {
	type: AppConnectionType.CUSTOM_AUTH;
	props: { username: string; password: string; confluenceDomain: string };
};

export type ConfluencePaginatedResponse<T> = {
	results?: T[];
	_links?: {
		next?: string;
	};
};

export type ConfluenceCurrentUser = {
	type?: string;
	accountId?: string;
	email?: string;
	displayName?: string;
};

export type ConfluenceSpace = { id: string; name: string; key: string; homepageId: string };

export type ConfluencePageSummary = { id: string; title: string };

export type ConfluenceTemplateSummary = { templateId: string; name: string };

export type ConfluenceFolderSummary = { id: string; title: string };

export type ConfluenceTemplate = { body: { storage: { value: string } } };

export type ConfluenceTemplateVariableNode = {
	$?: { 'at:name'?: string };
	'at:option'?: Array<{ $: { 'at:value': string } }>;
};

export type ConfluenceTemplateDeclarations = Record<
	string,
	ConfluenceTemplateVariableNode | ConfluenceTemplateVariableNode[]
>;

export type ConfluencePage = {
	id: string;
	title: string;
	status: string;
	spaceId: string;
	createdAt: string;
	version: { number: number; createdAt: string };
	body?: { storage?: { value: string; representation: string } };
};

export type ConfluenceAttachment = {
	id: string;
	title: string;
	pageId?: string;
	mediaType: string;
	fileSize: number;
	version: { number: number; createdAt: string };
	downloadLink: string;
};

export type ConfluenceComment = {
	id: string;
	status: string;
	pageId: string;
	version: { number: number; createdAt: string };
	body: unknown;
};

export type ConfluenceBlogPost = {
	id: string;
	status: string;
	title: string;
	spaceId: string;
	createdAt: string;
	version: { number: number; createdAt: string };
};

export type ConfluenceUserSearchResult = {
	results?: Array<{ user: Record<string, unknown> }>;
	totalSize?: number;
};

export type ConfluenceCqlSearchResponse = {
	results: unknown[];
	size: number;
	start: number;
	limit: number;
	totalSize?: number;
	_links?: { next?: string };
};
