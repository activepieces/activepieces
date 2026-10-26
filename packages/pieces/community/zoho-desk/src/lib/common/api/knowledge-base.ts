import { HttpMethod } from '@activepieces/pieces-common';

import { zohoDeskClient } from '../client';

import type { ZohoDeskAuthValue, ZohoDeskRecord } from '../types';

async function listArticles({
	auth,
	orgId,
	categoryId,
	status,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	categoryId?: string;
	status?: string[];
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/articles`,
		query: { categoryId, status, sortBy, from, limit },
	});
}

async function searchArticles({
	auth,
	orgId,
	searchText,
	title,
	departmentId,
	categoryId,
	tag,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	searchText?: string;
	title?: string;
	departmentId?: string;
	categoryId?: string;
	tag?: string[];
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/articles/search`,
		query: { _all: searchText, title, departmentId, categoryId, tag, sortBy, from, limit },
	});
}

async function getArticle({
	auth,
	orgId,
	articleId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	articleId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/articles/${encodeURIComponent(articleId)}`,
	});
}

export const zohoDeskKnowledgeBaseApi = { listArticles, searchArticles, getArticle };
