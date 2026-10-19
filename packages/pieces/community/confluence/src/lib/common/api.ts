import FormData from 'form-data';

import { HttpMethod } from '@activepieces/pieces-common';

import { confluenceClient } from './client';

import type {
	ConfluenceAttachment,
	ConfluenceAuthValue,
	ConfluenceBlogPost,
	ConfluenceComment,
	ConfluenceCqlSearchResponse,
	ConfluenceCurrentUser,
	ConfluenceFolderSummary,
	ConfluencePage,
	ConfluencePageSummary,
	ConfluencePaginatedResponse,
	ConfluenceSpace,
	ConfluenceTemplate,
	ConfluenceTemplateSummary,
	ConfluenceUserSearchResult,
} from './types';

async function getCurrentUser({
	auth,
}: {
	auth: ConfluenceAuthValue;
}): Promise<ConfluenceCurrentUser> {
	return await confluenceClient.request<ConfluenceCurrentUser>({
		auth,
		method: HttpMethod.GET,
		path: `${V1}/user/current`,
	});
}

async function listSpaces({
	auth,
	query,
}: {
	auth: ConfluenceAuthValue;
	query?: Record<string, string>;
}): Promise<ConfluenceSpace[]> {
	return await confluenceClient.paginateCursor<ConfluenceSpace>({
		auth,
		path: `${V2}/spaces`,
		query,
	});
}

async function getSpace({
	auth,
	spaceId,
}: {
	auth: ConfluenceAuthValue;
	spaceId: string;
}): Promise<ConfluenceSpace> {
	return await confluenceClient.request<ConfluenceSpace>({
		auth,
		method: HttpMethod.GET,
		path: `${V2}/spaces/${spaceId}`,
	});
}

async function listPages({
	auth,
	spaceId,
}: {
	auth: ConfluenceAuthValue;
	spaceId?: string;
}): Promise<ConfluencePageSummary[]> {
	return await confluenceClient.paginateCursor<ConfluencePageSummary>({
		auth,
		path: spaceId ? `${V2}/spaces/${spaceId}/pages` : `${V2}/pages`,
	});
}

async function listSpacePages({
	auth,
	spaceId,
	sort,
}: {
	auth: ConfluenceAuthValue;
	spaceId: string | undefined;
	sort: string;
}): Promise<ConfluencePage[]> {
	const response = await confluenceClient.request<ConfluencePaginatedResponse<ConfluencePage>>({
		auth,
		method: HttpMethod.GET,
		path: `${V2}/spaces/${spaceId}/pages`,
		query: { limit: '100', sort },
	});
	return response.results ?? [];
}

async function listSpaceBlogPosts({
	auth,
	spaceId,
}: {
	auth: ConfluenceAuthValue;
	spaceId: string | undefined;
}): Promise<ConfluenceBlogPost[]> {
	const response = await confluenceClient.request<ConfluencePaginatedResponse<ConfluenceBlogPost>>({
		auth,
		method: HttpMethod.GET,
		path: `${V2}/spaces/${spaceId}/blogposts`,
		query: { limit: '100', sort: '-created-date' },
	});
	return response.results ?? [];
}

async function findPagesByTitle({
	auth,
	title,
	spaceId,
}: {
	auth: ConfluenceAuthValue;
	title: string;
	spaceId?: string;
}): Promise<ConfluencePage[]> {
	const query: Record<string, string> = { title, limit: '25' };
	if (spaceId) query['space-id'] = spaceId;

	const response = await confluenceClient.request<ConfluencePaginatedResponse<ConfluencePage>>({
		auth,
		method: HttpMethod.GET,
		path: `${V2}/pages`,
		query,
	});
	return response.results ?? [];
}

async function getPage({
	auth,
	pageId,
	bodyFormat,
	getDraft,
}: {
	auth: ConfluenceAuthValue;
	pageId: string;
	bodyFormat?: string;
	getDraft?: boolean;
}): Promise<ConfluencePage> {
	return await confluenceClient.request<ConfluencePage>({
		auth,
		method: HttpMethod.GET,
		path: `${V2}/pages/${pageId}`,
		query: bodyFormat
			? { 'body-format': bodyFormat, ...(getDraft ? { 'get-draft': 'true' } : {}) }
			: undefined,
	});
}

async function listPageChildren({
	auth,
	pageId,
}: {
	auth: ConfluenceAuthValue;
	pageId: string;
}): Promise<ConfluencePageSummary[]> {
	const response = await confluenceClient.request<{ results: ConfluencePageSummary[] }>({
		auth,
		method: HttpMethod.GET,
		path: `${V2}/pages/${pageId}/children`,
	});
	return response.results;
}

async function createPage({
	auth,
	spaceId,
	parentId,
	title,
	status,
	representation,
	value,
}: {
	auth: ConfluenceAuthValue;
	spaceId: string;
	parentId: string | undefined;
	title: string;
	status: string;
	representation: string;
	value: string;
}): Promise<unknown> {
	return await confluenceClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: `${V2}/pages`,
		body: {
			spaceId,
			parentId,
			title,
			status,
			body: { representation, value },
		},
	});
}

async function updatePage({
	auth,
	pageId,
	status,
	title,
	representation,
	value,
	versionNumber,
}: {
	auth: ConfluenceAuthValue;
	pageId: string;
	status: string;
	title: string;
	representation: string;
	value: string;
	versionNumber: number;
}): Promise<unknown> {
	return await confluenceClient.request<unknown>({
		auth,
		method: HttpMethod.PUT,
		path: `${V2}/pages/${pageId}`,
		body: {
			id: pageId,
			status,
			title,
			body: { representation, value },
			version: { number: versionNumber },
		},
	});
}

async function deletePage({
	auth,
	pageId,
	purge,
}: {
	auth: ConfluenceAuthValue;
	pageId: string;
	purge?: boolean;
}): Promise<void> {
	await confluenceClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `${V2}/pages/${pageId}`,
		query: purge ? { purge: 'true' } : undefined,
	});
}

async function movePage({
	auth,
	pageId,
	position,
	targetPageId,
}: {
	auth: ConfluenceAuthValue;
	pageId: string;
	position: string;
	targetPageId: string;
}): Promise<void> {
	await confluenceClient.request<unknown>({
		auth,
		method: HttpMethod.PUT,
		path: `${V1}/content/${pageId}/move/${position}/${targetPageId}`,
	});
}

async function searchContent({
	auth,
	cql,
	maxResults,
	expand,
}: {
	auth: ConfluenceAuthValue;
	cql: string;
	maxResults: number;
	expand?: string;
}): Promise<unknown[]> {
	const all: unknown[] = [];
	let start = 0;
	const pageSize = 50;

	while (all.length < maxResults) {
		const limit = Math.min(pageSize, maxResults - all.length);
		const response = await confluenceClient.request<ConfluenceCqlSearchResponse>({
			auth,
			method: HttpMethod.GET,
			path: `${V1}/content/search`,
			query: {
				cql,
				start: String(start),
				limit: String(limit),
				...(expand ? { expand } : {}),
			},
		});

		all.push(...response.results);
		if (response.results.length < limit || !response._links?.next) break;
		start += response.results.length;
	}

	return all;
}

async function listPageTemplates({
	auth,
	spaceKey,
}: {
	auth: ConfluenceAuthValue;
	spaceKey: string;
}): Promise<ConfluenceTemplateSummary[]> {
	return await confluenceClient.paginateOffset<ConfluenceTemplateSummary>({
		auth,
		path: `${V1}/template/page`,
		query: { spaceKey },
	});
}

async function getTemplate({
	auth,
	templateId,
}: {
	auth: ConfluenceAuthValue;
	templateId: string;
}): Promise<ConfluenceTemplate> {
	return await confluenceClient.request<ConfluenceTemplate>({
		auth,
		method: HttpMethod.GET,
		path: `${V1}/template/${templateId}`,
	});
}

async function listFolderDescendants({
	auth,
	contentId,
}: {
	auth: ConfluenceAuthValue;
	contentId: string;
}): Promise<ConfluenceFolderSummary[]> {
	return await confluenceClient.paginateOffset<ConfluenceFolderSummary>({
		auth,
		path: `${V1}/content/${contentId}/descendant/folder`,
	});
}

async function createFooterComment({
	auth,
	pageId,
	parentCommentId,
	value,
}: {
	auth: ConfluenceAuthValue;
	pageId?: string;
	parentCommentId?: string;
	value: string;
}): Promise<unknown> {
	return await confluenceClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: `${V2}/footer-comments`,
		body: {
			pageId,
			parentCommentId,
			body: {
				representation: 'storage',
				value,
			},
		},
	});
}

async function listPageComments({
	auth,
	pageId,
	commentType,
	bodyFormat,
	sort,
}: {
	auth: ConfluenceAuthValue;
	pageId: string | undefined;
	commentType: string;
	bodyFormat: string;
	sort?: string;
}): Promise<ConfluenceComment[]> {
	const response = await confluenceClient.request<ConfluencePaginatedResponse<ConfluenceComment>>({
		auth,
		method: HttpMethod.GET,
		path: `${V2}/pages/${pageId}/${commentType}-comments`,
		query: {
			limit: '100',
			...(sort ? { sort } : {}),
			'body-format': bodyFormat,
		},
	});
	return response.results ?? [];
}

async function listPageAttachments({
	auth,
	pageId,
	sort,
}: {
	auth: ConfluenceAuthValue;
	pageId: string | undefined;
	sort?: string;
}): Promise<ConfluenceAttachment[]> {
	const response = await confluenceClient.request<
		ConfluencePaginatedResponse<ConfluenceAttachment>
	>({
		auth,
		method: HttpMethod.GET,
		path: `${V2}/pages/${pageId}/attachments`,
		query: { limit: '100', ...(sort ? { sort } : {}) },
	});
	return response.results ?? [];
}

async function getAttachment({
	auth,
	attachmentId,
}: {
	auth: ConfluenceAuthValue;
	attachmentId: string;
}): Promise<ConfluenceAttachment> {
	return await confluenceClient.request<ConfluenceAttachment>({
		auth,
		method: HttpMethod.GET,
		path: `${V2}/attachments/${attachmentId}`,
	});
}

async function downloadAttachment({
	auth,
	downloadLink,
}: {
	auth: ConfluenceAuthValue;
	downloadLink: string;
}): Promise<Buffer> {
	return await confluenceClient.request<Buffer>({
		auth,
		method: HttpMethod.GET,
		path: downloadLink,
		responseType: 'arraybuffer',
		followRedirects: true,
	});
}

async function uploadAttachment({
	auth,
	pageId,
	file,
	comment,
	minorEdit,
}: {
	auth: ConfluenceAuthValue;
	pageId: string;
	file: { base64: string; filename: string };
	comment?: string;
	minorEdit?: boolean;
}): Promise<unknown> {
	const formData = new FormData();
	const buffer = Buffer.from(file.base64, 'base64');
	formData.append('file', buffer, file.filename);
	if (comment) formData.append('comment', comment);
	formData.append('minorEdit', String(minorEdit ?? true));

	return await confluenceClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: `${V1}/content/${pageId}/child/attachment`,
		headers: {
			'X-Atlassian-Token': 'no-check',
			...formData.getHeaders(),
		},
		body: formData,
	});
}

async function addLabels({
	auth,
	pageId,
	prefix,
	names,
}: {
	auth: ConfluenceAuthValue;
	pageId: string;
	prefix: string;
	names: unknown[];
}): Promise<unknown> {
	return await confluenceClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: `${V1}/content/${pageId}/label`,
		body: names.map((name) => ({ prefix, name })),
	});
}

async function removeLabel({
	auth,
	pageId,
	label,
}: {
	auth: ConfluenceAuthValue;
	pageId: string;
	label: string;
}): Promise<void> {
	await confluenceClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `${V1}/content/${pageId}/label`,
		query: { name: label },
	});
}

async function searchUsers({
	auth,
	keyword,
	limit,
}: {
	auth: ConfluenceAuthValue;
	keyword: string;
	limit?: number;
}): Promise<Record<string, unknown>[]> {
	const cql = `user.fullname ~ "${keyword.replace(/"/g, '\\"')}" OR user = "${keyword.replace(
		/"/g,
		'\\"',
	)}"`;

	const response = await confluenceClient.request<ConfluenceUserSearchResult>({
		auth,
		method: HttpMethod.GET,
		path: `${V1}/search/user`,
		query: {
			cql,
			limit: String(limit ?? 25),
		},
	});
	return (response.results ?? []).map((r) => r.user);
}

export const confluenceApi = {
	getCurrentUser,
	listSpaces,
	getSpace,
	listPages,
	listSpacePages,
	listSpaceBlogPosts,
	findPagesByTitle,
	getPage,
	listPageChildren,
	createPage,
	updatePage,
	deletePage,
	movePage,
	searchContent,
	listPageTemplates,
	getTemplate,
	listFolderDescendants,
	createFooterComment,
	listPageComments,
	listPageAttachments,
	getAttachment,
	downloadAttachment,
	uploadAttachment,
	addLabels,
	removeLabel,
	searchUsers,
};

const V1 = '/rest/api';
const V2 = '/api/v2';
