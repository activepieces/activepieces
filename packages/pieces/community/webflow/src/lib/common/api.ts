import { HttpMethod } from '@activepieces/pieces-common';
import { webflowClient } from './client';
import type {
	WebflowAuthValue,
	WebflowCollection,
	WebflowCollectionDetails,
	WebflowSite,
} from './types';

async function listSites({ auth }: { auth: WebflowAuthValue }): Promise<WebflowSite[]> {
	const response = await webflowClient.request<{ sites: WebflowSite[] }>({
		auth,
		method: HttpMethod.GET,
		path: '/v2/sites',
	});
	return response.sites;
}

async function listCollections({ auth, siteId }: { auth: WebflowAuthValue; siteId: string }): Promise<WebflowCollection[]> {
	const response = await webflowClient.request<{ collections: WebflowCollection[] }>({
		auth,
		method: HttpMethod.GET,
		path: `/v2/sites/${encodeURIComponent(siteId)}/collections`,
	});
	return response.collections;
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
		path: `/v2/collections/${encodeURIComponent(collectionId)}`,
	});
}

export const webflowApi = { listSites, listCollections, getCollection };
