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

export type ConfluenceRecord = Record<string, unknown>;

export type ConfluenceQuery = Record<string, string | number | boolean | undefined>;

export type ConfluenceCursorPage = {
	results: ConfluenceRecord[];
	count: number;
	nextCursor: string | null;
};

export type ConfluenceContentType =
	| 'pages'
	| 'blogposts'
	| 'attachments'
	| 'whiteboards'
	| 'folders'
	| 'spaces'
	| 'labels'
	| 'footer-comments'
	| 'inline-comments';

export type ConfluenceVersionedContent = {
	id: string;
	title: string;
	status: string;
	version: { number: number };
	body?: { storage?: { value: string } };
};

export type ConfluenceContentProperty = {
	id: string;
	key: string;
	value: unknown;
	version: { number: number };
};

export type ConfluenceTask = {
	id: string;
	localId?: string;
	spaceId?: string;
	pageId?: string;
	blogPostId?: string;
	status: string;
	createdBy?: string;
	assignedTo?: string;
	completedBy?: string;
	createdAt?: string;
	updatedAt?: string;
	dueAt?: string;
	completedAt?: string;
};

export type ConfluenceCopyDestination = {
	type: string;
	value: string;
};

export type ConfluenceCqlSearchResponse = {
	results: unknown[];
	size: number;
	start: number;
	limit: number;
	totalSize?: number;
	_links?: { next?: string };
};
