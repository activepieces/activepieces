import { HttpMethod } from '@activepieces/pieces-common';
import { webflowClient } from './client';
import type { WebflowAuthValue, WebflowCollection, WebflowCollectionDetails, WebflowSite } from './types';

async function listSites({ auth }: { auth: WebflowAuthValue }): Promise<WebflowSite[]> {
	return await webflowClient.request<WebflowSite[]>({ auth, method: HttpMethod.GET, path: '/sites' });
}

async function listCollections({ auth, siteId }: { auth: WebflowAuthValue; siteId: string }): Promise<WebflowCollection[]> {
	return await webflowClient.request<WebflowCollection[]>({
		auth,
		method: HttpMethod.GET,
		path: `/sites/${siteId}/collections`,
	});
}

async function getCollection({
	auth,
	collectionId,
}: {
	auth: WebflowAuthValue;
	collectionId: string;
}): Promise<WebflowCollectionDetails> {
	return await webflowClient.request<WebflowCollectionDetails>({
		auth,
		method: HttpMethod.GET,
		path: `/collections/${collectionId}`,
	});
}

export const webflowApi = { listSites, listCollections, getCollection };
