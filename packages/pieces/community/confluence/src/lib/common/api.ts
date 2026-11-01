import FormData from 'form-data';

import { HttpMethod } from '@activepieces/pieces-common';

import { confluenceClient } from './client';

import type {
	ConfluenceAttachment,
	ConfluenceAuthValue,
	ConfluenceBlogPost,
	ConfluenceComment,
	ConfluenceContentProperty,
	ConfluenceContentType,
	ConfluenceCopyDestination,
	ConfluenceCqlSearchResponse,
	ConfluenceCurrentUser,
	ConfluenceCursorPage,
	ConfluenceFolderSummary,
	ConfluencePage,
	ConfluencePageSummary,
	ConfluencePaginatedResponse,
	ConfluenceQuery,
	ConfluenceRecord,
	ConfluenceSpace,
	ConfluenceTemplate,
	ConfluenceTask,
	ConfluenceTemplateSummary,
	ConfluenceUserSearchResult,
	ConfluenceVersionedContent,
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
	isPrivate,
}: {
	auth: ConfluenceAuthValue;
	spaceId: string;
	parentId: string | undefined;
	title: string;
	status: string;
	representation: string;
	value: string;
	isPrivate?: boolean;
}): Promise<unknown> {
	return await confluenceClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: `${V2}/pages`,
		query: isPrivate ? { private: 'true' } : undefined,
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
	parentId,
	versionMessage,
}: {
	auth: ConfluenceAuthValue;
	pageId: string;
	status: string;
	title: string;
	representation: string;
	value: string;
	versionNumber: number;
	parentId?: string;
	versionMessage?: string;
}): Promise<unknown> {
	return await confluenceClient.request<unknown>({
		auth,
		method: HttpMethod.PUT,
		path: `${V2}/pages/${pageId}`,
		body: {
			id: pageId,
			status,
			title,
			parentId,
			body: { representation, value },
			version: { number: versionNumber, message: versionMessage },
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

async function listPagesPage({
	auth,
	query,
}: {
	auth: ConfluenceAuthValue;
	query: ConfluenceQuery;
}): Promise<ConfluenceCursorPage> {
	return await getCursorPage({ auth, path: `${V2}/pages`, query });
}

async function getContent({
	auth,
	contentType,
	contentId,
	query,
}: {
	auth: ConfluenceAuthValue;
	contentType: ConfluenceContentType;
	contentId: string;
	query?: ConfluenceQuery;
}): Promise<ConfluenceRecord> {
	return await getRecord({ auth, path: `${V2}/${contentType}/${contentId}`, query });
}

async function getVersionedContent({
	auth,
	contentType,
	contentId,
}: {
	auth: ConfluenceAuthValue;
	contentType: ConfluenceContentType;
	contentId: string;
}): Promise<ConfluenceVersionedContent> {
	return await confluenceClient.request<ConfluenceVersionedContent>({
		auth,
		method: HttpMethod.GET,
		path: `${V2}/${contentType}/${contentId}`,
		query: { 'body-format': 'storage' },
	});
}

async function deleteContent({
	auth,
	contentType,
	contentId,
	query,
}: {
	auth: ConfluenceAuthValue;
	contentType: ConfluenceContentType;
	contentId: string;
	query?: ConfluenceQuery;
}): Promise<void> {
	await confluenceClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `${V2}/${contentType}/${contentId}`,
		query: query ? toQuery({ query }) : undefined,
	});
}

async function listContentChildren({
	auth,
	contentType,
	contentId,
	relation,
	query,
}: {
	auth: ConfluenceAuthValue;
	contentType: ConfluenceContentType;
	contentId: string;
	relation: string;
	query: ConfluenceQuery;
}): Promise<ConfluenceCursorPage> {
	return await getCursorPage({
		auth,
		path: `${V2}/${contentType}/${contentId}/${relation}`,
		query,
	});
}

async function getContentLikeCount({
	auth,
	contentType,
	contentId,
}: {
	auth: ConfluenceAuthValue;
	contentType: ConfluenceContentType;
	contentId: string;
}): Promise<ConfluenceRecord> {
	return await getRecord({ auth, path: `${V2}/${contentType}/${contentId}/likes/count` });
}

async function listContentOperations({
	auth,
	contentType,
	contentId,
}: {
	auth: ConfluenceAuthValue;
	contentType: ConfluenceContentType;
	contentId: string;
}): Promise<ConfluenceRecord> {
	return await getRecord({ auth, path: `${V2}/${contentType}/${contentId}/operations` });
}

async function getContentVersion({
	auth,
	contentType,
	contentId,
	versionNumber,
}: {
	auth: ConfluenceAuthValue;
	contentType: ConfluenceContentType;
	contentId: string;
	versionNumber: number;
}): Promise<ConfluenceRecord> {
	return await getRecord({
		auth,
		path: `${V2}/${contentType}/${contentId}/versions/${versionNumber}`,
	});
}

async function createBlogPost({
	auth,
	spaceId,
	title,
	status,
	representation,
	value,
	isPrivate,
}: {
	auth: ConfluenceAuthValue;
	spaceId: string;
	title: string;
	status: string;
	representation: string;
	value: string;
	isPrivate?: boolean;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.POST,
		path: `${V2}/blogposts`,
		query: isPrivate ? { private: 'true' } : undefined,
		body: { spaceId, title, status, body: { representation, value } },
	});
}

async function updateBlogPost({
	auth,
	blogPostId,
	title,
	status,
	representation,
	value,
	versionNumber,
	versionMessage,
}: {
	auth: ConfluenceAuthValue;
	blogPostId: string;
	title: string;
	status: string;
	representation: string;
	value: string;
	versionNumber: number;
	versionMessage?: string;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.PUT,
		path: `${V2}/blogposts/${blogPostId}`,
		body: {
			id: blogPostId,
			status,
			title,
			body: { representation, value },
			version: { number: versionNumber, message: versionMessage },
		},
	});
}

async function listBlogPostsPage({
	auth,
	query,
}: {
	auth: ConfluenceAuthValue;
	query: ConfluenceQuery;
}): Promise<ConfluenceCursorPage> {
	return await getCursorPage({ auth, path: `${V2}/blogposts`, query });
}

async function createFooterCommentOn({
	auth,
	pageId,
	blogPostId,
	attachmentId,
	representation,
	value,
}: {
	auth: ConfluenceAuthValue;
	pageId?: string;
	blogPostId?: string;
	attachmentId?: string;
	representation: string;
	value: string;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.POST,
		path: `${V2}/footer-comments`,
		body: { pageId, blogPostId, attachmentId, body: { representation, value } },
	});
}

async function createInlineComment({
	auth,
	pageId,
	blogPostId,
	parentCommentId,
	representation,
	value,
	textSelection,
	textSelectionMatchCount,
	textSelectionMatchIndex,
}: {
	auth: ConfluenceAuthValue;
	pageId?: string;
	blogPostId?: string;
	parentCommentId?: string;
	representation: string;
	value: string;
	textSelection?: string;
	textSelectionMatchCount?: number;
	textSelectionMatchIndex?: number;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.POST,
		path: `${V2}/inline-comments`,
		body: {
			pageId,
			blogPostId,
			parentCommentId,
			body: { representation, value },
			inlineCommentProperties:
				textSelection === undefined
					? undefined
					: { textSelection, textSelectionMatchCount, textSelectionMatchIndex },
		},
	});
}

async function updateComment({
	auth,
	commentType,
	commentId,
	representation,
	value,
	versionNumber,
	resolved,
}: {
	auth: ConfluenceAuthValue;
	commentType: 'footer-comments' | 'inline-comments';
	commentId: string;
	representation: string;
	value: string;
	versionNumber: number;
	resolved?: boolean;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.PUT,
		path: `${V2}/${commentType}/${commentId}`,
		body: { version: { number: versionNumber }, body: { representation, value }, resolved },
	});
}

async function listLabelsPage({
	auth,
	query,
}: {
	auth: ConfluenceAuthValue;
	query: ConfluenceQuery;
}): Promise<ConfluenceCursorPage> {
	return await getCursorPage({ auth, path: `${V2}/labels`, query });
}

async function getLabel({
	auth,
	name,
	type,
	start,
	limit,
}: {
	auth: ConfluenceAuthValue;
	name: string;
	type?: string;
	start?: number;
	limit?: number;
}): Promise<ConfluenceRecord> {
	return await getRecord({ auth, path: `${V1}/label`, query: { name, type, start, limit } });
}

async function addSpaceLabels({
	auth,
	spaceKey,
	prefix,
	names,
}: {
	auth: ConfluenceAuthValue;
	spaceKey: string;
	prefix: string;
	names: string[];
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.POST,
		path: `${V1}/space/${spaceKey}/label`,
		body: names.map((name) => ({ prefix, name })),
	});
}

async function removeSpaceLabel({
	auth,
	spaceKey,
	name,
	prefix,
}: {
	auth: ConfluenceAuthValue;
	spaceKey: string;
	name: string;
	prefix?: string;
}): Promise<void> {
	await confluenceClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `${V1}/space/${spaceKey}/label`,
		query: toQuery({ query: { name, prefix } }),
	});
}

async function createContentProperty({
	auth,
	contentType,
	contentId,
	key,
	value,
}: {
	auth: ConfluenceAuthValue;
	contentType: ConfluenceContentType;
	contentId: string;
	key: string;
	value: unknown;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.POST,
		path: `${V2}/${contentType}/${contentId}/properties`,
		body: { key, value },
	});
}

async function getContentProperty({
	auth,
	contentType,
	contentId,
	propertyId,
}: {
	auth: ConfluenceAuthValue;
	contentType: ConfluenceContentType;
	contentId: string;
	propertyId: string;
}): Promise<ConfluenceContentProperty> {
	return await confluenceClient.request<ConfluenceContentProperty>({
		auth,
		method: HttpMethod.GET,
		path: `${V2}/${contentType}/${contentId}/properties/${propertyId}`,
	});
}

async function updateContentProperty({
	auth,
	contentType,
	contentId,
	propertyId,
	key,
	value,
	versionNumber,
}: {
	auth: ConfluenceAuthValue;
	contentType: ConfluenceContentType;
	contentId: string;
	propertyId: string;
	key: string;
	value: unknown;
	versionNumber: number;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.PUT,
		path: `${V2}/${contentType}/${contentId}/properties/${propertyId}`,
		body: { key, value, version: { number: versionNumber } },
	});
}

async function deleteContentProperty({
	auth,
	contentType,
	contentId,
	propertyId,
}: {
	auth: ConfluenceAuthValue;
	contentType: ConfluenceContentType;
	contentId: string;
	propertyId: string;
}): Promise<void> {
	await confluenceClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `${V2}/${contentType}/${contentId}/properties/${propertyId}`,
	});
}

async function listSpacesPage({
	auth,
	query,
}: {
	auth: ConfluenceAuthValue;
	query: ConfluenceQuery;
}): Promise<ConfluenceCursorPage> {
	return await getCursorPage({ auth, path: `${V2}/spaces`, query });
}

async function createSpace({
	auth,
	name,
	key,
	description,
	isPrivate,
}: {
	auth: ConfluenceAuthValue;
	name: string;
	key?: string;
	description?: string;
	isPrivate?: boolean;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.POST,
		path: `${V2}/spaces`,
		body: {
			name,
			key,
			description:
				description === undefined ? undefined : { value: description, representation: 'plain' },
			createPrivateSpace: isPrivate,
		},
	});
}

async function updateSpace({
	auth,
	spaceKey,
	name,
	description,
	homepageId,
	status,
}: {
	auth: ConfluenceAuthValue;
	spaceKey: string;
	name?: string;
	description?: string;
	homepageId?: string;
	status?: string;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.PUT,
		path: `${V1}/space/${spaceKey}`,
		body: {
			name,
			description:
				description === undefined
					? undefined
					: { plain: { value: description, representation: 'plain' } },
			homepage: homepageId === undefined ? undefined : { id: homepageId },
			status,
		},
	});
}

async function deleteSpace({
	auth,
	spaceKey,
}: {
	auth: ConfluenceAuthValue;
	spaceKey: string;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.DELETE,
		path: `${V1}/space/${spaceKey}`,
	});
}

async function createWhiteboard({
	auth,
	spaceId,
	title,
	parentId,
	templateKey,
	isPrivate,
}: {
	auth: ConfluenceAuthValue;
	spaceId: string;
	title?: string;
	parentId?: string;
	templateKey?: string;
	isPrivate?: boolean;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.POST,
		path: `${V2}/whiteboards`,
		query: isPrivate ? { private: 'true' } : undefined,
		body: { spaceId, title, parentId, templateKey },
	});
}

async function createFolder({
	auth,
	spaceId,
	title,
	parentId,
}: {
	auth: ConfluenceAuthValue;
	spaceId: string;
	title?: string;
	parentId?: string;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.POST,
		path: `${V2}/folders`,
		body: { spaceId, title, parentId },
	});
}

async function listTasksPage({
	auth,
	query,
}: {
	auth: ConfluenceAuthValue;
	query: ConfluenceQuery;
}): Promise<ConfluenceCursorPage> {
	return await getCursorPage({ auth, path: `${V2}/tasks`, query });
}

async function getTask({
	auth,
	taskId,
	bodyFormat,
}: {
	auth: ConfluenceAuthValue;
	taskId: string;
	bodyFormat?: string;
}): Promise<ConfluenceTask> {
	return await confluenceClient.request<ConfluenceTask>({
		auth,
		method: HttpMethod.GET,
		path: `${V2}/tasks/${taskId}`,
		query: toQuery({ query: { 'body-format': bodyFormat } }),
	});
}

async function updateTask({
	auth,
	task,
	status,
}: {
	auth: ConfluenceAuthValue;
	task: ConfluenceTask;
	status: string;
}): Promise<ConfluenceTask> {
	return await confluenceClient.request<ConfluenceTask>({
		auth,
		method: HttpMethod.PUT,
		path: `${V2}/tasks/${task.id}`,
		query: { 'body-format': 'storage' },
		body: {
			id: task.id,
			localId: task.localId,
			spaceId: task.spaceId,
			pageId: task.pageId,
			blogPostId: task.blogPostId,
			status,
			createdBy: task.createdBy,
			assignedTo: task.assignedTo,
			completedBy: task.completedBy,
			createdAt: task.createdAt,
			updatedAt: task.updatedAt,
			dueAt: task.dueAt,
			completedAt: task.completedAt,
		},
	});
}

async function getUser({
	auth,
	accountId,
}: {
	auth: ConfluenceAuthValue;
	accountId: string;
}): Promise<ConfluenceRecord> {
	return await getRecord({ auth, path: `${V1}/user`, query: { accountId } });
}

async function listGroups({
	auth,
	query,
}: {
	auth: ConfluenceAuthValue;
	query: ConfluenceQuery;
}): Promise<ConfluenceRecord> {
	return await getRecord({ auth, path: `${V1}/group`, query });
}

async function listGroupMembers({
	auth,
	groupId,
	query,
}: {
	auth: ConfluenceAuthValue;
	groupId: string;
	query: ConfluenceQuery;
}): Promise<ConfluenceRecord> {
	return await getRecord({ auth, path: `${V1}/group/${groupId}/membersByGroupId`, query });
}

async function searchByCql({
	auth,
	query,
}: {
	auth: ConfluenceAuthValue;
	query: ConfluenceQuery;
}): Promise<ConfluenceCursorPage> {
	return await getCursorPage({ auth, path: `${V1}/search`, query });
}

async function listAuditRecords({
	auth,
	query,
}: {
	auth: ConfluenceAuthValue;
	query: ConfluenceQuery;
}): Promise<ConfluenceRecord> {
	return await getRecord({ auth, path: `${V1}/audit`, query });
}

async function getContentRestrictions({
	auth,
	contentId,
	query,
}: {
	auth: ConfluenceAuthValue;
	contentId: string;
	query: ConfluenceQuery;
}): Promise<ConfluenceRecord> {
	return await getRecord({ auth, path: `${V1}/content/${contentId}/restriction`, query });
}

async function listPageTemplatesPage({
	auth,
	query,
}: {
	auth: ConfluenceAuthValue;
	query: ConfluenceQuery;
}): Promise<ConfluenceRecord> {
	return await getRecord({ auth, path: `${V1}/template/page`, query });
}

async function getTemplateDetails({
	auth,
	templateId,
}: {
	auth: ConfluenceAuthValue;
	templateId: string;
}): Promise<ConfluenceRecord> {
	return await getRecord({
		auth,
		path: `${V1}/template/${templateId}`,
		query: { expand: 'body.storage' },
	});
}

async function updatePageTitle({
	auth,
	pageId,
	title,
	status,
}: {
	auth: ConfluenceAuthValue;
	pageId: string;
	title: string;
	status: string;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.PUT,
		path: `${V2}/pages/${pageId}/title`,
		body: { status, title },
	});
}

async function restoreContentVersion({
	auth,
	contentId,
	versionNumber,
	message,
	restoreTitle,
}: {
	auth: ConfluenceAuthValue;
	contentId: string;
	versionNumber: number;
	message: string;
	restoreTitle?: boolean;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.POST,
		path: `${V1}/content/${contentId}/version`,
		body: { operationKey: 'restore', params: { versionNumber, message, restoreTitle } },
	});
}

async function copyPage({
	auth,
	pageId,
	destination,
	pageTitle,
	copyAttachments,
	copyLabels,
	copyPermissions,
	copyProperties,
}: {
	auth: ConfluenceAuthValue;
	pageId: string;
	destination: ConfluenceCopyDestination;
	pageTitle?: string;
	copyAttachments?: boolean;
	copyLabels?: boolean;
	copyPermissions?: boolean;
	copyProperties?: boolean;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.POST,
		path: `${V1}/content/${pageId}/copy`,
		body: { destination, pageTitle, copyAttachments, copyLabels, copyPermissions, copyProperties },
	});
}

async function archivePages({
	auth,
	pageIds,
}: {
	auth: ConfluenceAuthValue;
	pageIds: string[];
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.POST,
		path: `${V1}/content/archive`,
		body: { pages: pageIds.map((id) => ({ id })) },
	});
}

async function getLongTask({
	auth,
	taskId,
}: {
	auth: ConfluenceAuthValue;
	taskId: string;
}): Promise<ConfluenceRecord> {
	return await getRecord({ auth, path: `${V1}/longtask/${taskId}` });
}

async function getContentViews({
	auth,
	contentId,
	fromDate,
}: {
	auth: ConfluenceAuthValue;
	contentId: string;
	fromDate?: string;
}): Promise<ConfluenceRecord> {
	return await getRecord({
		auth,
		path: `${V1}/analytics/content/${contentId}/views`,
		query: { fromDate },
	});
}

async function getContentViewers({
	auth,
	contentId,
	fromDate,
}: {
	auth: ConfluenceAuthValue;
	contentId: string;
	fromDate?: string;
}): Promise<ConfluenceRecord> {
	return await getRecord({
		auth,
		path: `${V1}/analytics/content/${contentId}/viewers`,
		query: { fromDate },
	});
}

async function getRecord({
	auth,
	path,
	query,
}: {
	auth: ConfluenceAuthValue;
	path: string;
	query?: ConfluenceQuery;
}): Promise<ConfluenceRecord> {
	return await confluenceClient.request<ConfluenceRecord>({
		auth,
		method: HttpMethod.GET,
		path,
		query: query ? toQuery({ query }) : undefined,
	});
}

async function getCursorPage({
	auth,
	path,
	query,
}: {
	auth: ConfluenceAuthValue;
	path: string;
	query: ConfluenceQuery;
}): Promise<ConfluenceCursorPage> {
	const response = await confluenceClient.request<ConfluencePaginatedResponse<ConfluenceRecord>>({
		auth,
		method: HttpMethod.GET,
		path,
		query: toQuery({ query: { ...query, limit: query['limit'] ?? DEFAULT_LIMIT } }),
	});
	const results = response.results ?? [];
	const next = response._links?.next;
	return {
		results,
		count: results.length,
		nextCursor: next
			? new URL(next, 'https://confluence.invalid').searchParams.get('cursor')
			: null,
	};
}

function toQuery({ query }: { query: ConfluenceQuery }): Record<string, string> {
	return Object.fromEntries(
		Object.entries(query)
			.filter(([, value]) => value !== undefined && value !== '')
			.map(([key, value]) => [key, String(value)]),
	);
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
	listPagesPage,
	getContent,
	getVersionedContent,
	deleteContent,
	listContentChildren,
	getContentLikeCount,
	listContentOperations,
	getContentVersion,
	createBlogPost,
	updateBlogPost,
	listBlogPostsPage,
	createFooterCommentOn,
	createInlineComment,
	updateComment,
	listLabelsPage,
	getLabel,
	addSpaceLabels,
	removeSpaceLabel,
	createContentProperty,
	getContentProperty,
	updateContentProperty,
	deleteContentProperty,
	listSpacesPage,
	createSpace,
	updateSpace,
	deleteSpace,
	createWhiteboard,
	createFolder,
	listTasksPage,
	getTask,
	updateTask,
	getUser,
	listGroups,
	listGroupMembers,
	searchByCql,
	listAuditRecords,
	getContentRestrictions,
	listPageTemplatesPage,
	getTemplateDetails,
	updatePageTitle,
	restoreContentVersion,
	copyPage,
	archivePages,
	getLongTask,
	getContentViews,
	getContentViewers,
};

const V1 = '/rest/api';
const V2 = '/api/v2';
const DEFAULT_LIMIT = 25;
