import { HttpMethod } from '@activepieces/pieces-common';

import { qdrantClient } from './client';

import type {
	QdrantAliasesList,
	QdrantAuthValue,
	QdrantBody,
	QdrantCollectionsList,
	QdrantRecord,
	QdrantScoredPoint,
	QdrantScrollResult,
	QdrantSnapshot,
	QdrantUpdateResult,
} from './types';

async function listCollections({
	auth,
}: {
	auth: QdrantAuthValue;
}): Promise<QdrantCollectionsList> {
	return await qdrantClient.request<QdrantCollectionsList>({
		auth,
		method: HttpMethod.GET,
		path: '/collections',
	});
}

async function getCollection({
	auth,
	collectionName,
}: CollectionParams & { auth: QdrantAuthValue }): Promise<QdrantBody> {
	return await qdrantClient.request<QdrantBody>({
		auth,
		method: HttpMethod.GET,
		path: collectionPath({ collectionName }),
	});
}

async function collectionExists({
	auth,
	collectionName,
}: CollectionParams & { auth: QdrantAuthValue }): Promise<{ exists: boolean }> {
	return await qdrantClient.request<{ exists: boolean }>({
		auth,
		method: HttpMethod.GET,
		path: `${collectionPath({ collectionName })}/exists`,
	});
}

async function createCollection({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<boolean> {
	return await qdrantClient.request<boolean>({
		auth,
		method: HttpMethod.PUT,
		path: collectionPath({ collectionName }),
		body,
	});
}

async function updateCollection({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<boolean> {
	return await qdrantClient.request<boolean>({
		auth,
		method: HttpMethod.PATCH,
		path: collectionPath({ collectionName }),
		body,
	});
}

async function deleteCollection({
	auth,
	collectionName,
}: CollectionParams & { auth: QdrantAuthValue }): Promise<boolean> {
	return await qdrantClient.request<boolean>({
		auth,
		method: HttpMethod.DELETE,
		path: collectionPath({ collectionName }),
	});
}

async function listAliases({ auth }: { auth: QdrantAuthValue }): Promise<QdrantAliasesList> {
	return await qdrantClient.request<QdrantAliasesList>({
		auth,
		method: HttpMethod.GET,
		path: '/aliases',
	});
}

async function listCollectionAliases({
	auth,
	collectionName,
}: CollectionParams & { auth: QdrantAuthValue }): Promise<QdrantAliasesList> {
	return await qdrantClient.request<QdrantAliasesList>({
		auth,
		method: HttpMethod.GET,
		path: `${collectionPath({ collectionName })}/aliases`,
	});
}

async function updateAliases({
	auth,
	actions,
}: {
	auth: QdrantAuthValue;
	actions: QdrantBody[];
}): Promise<boolean> {
	return await qdrantClient.request<boolean>({
		auth,
		method: HttpMethod.POST,
		path: '/collections/aliases',
		body: { actions },
	});
}

async function createSnapshot({
	auth,
	collectionName,
}: CollectionParams & { auth: QdrantAuthValue }): Promise<QdrantSnapshot> {
	return await qdrantClient.request<QdrantSnapshot>({
		auth,
		method: HttpMethod.POST,
		path: `${collectionPath({ collectionName })}/snapshots`,
		query: WAIT,
	});
}

async function listSnapshots({
	auth,
	collectionName,
}: CollectionParams & { auth: QdrantAuthValue }): Promise<QdrantSnapshot[]> {
	return await qdrantClient.request<QdrantSnapshot[]>({
		auth,
		method: HttpMethod.GET,
		path: `${collectionPath({ collectionName })}/snapshots`,
	});
}

async function deleteSnapshot({
	auth,
	collectionName,
	snapshotName,
}: CollectionParams & { auth: QdrantAuthValue; snapshotName: string }): Promise<boolean> {
	return await qdrantClient.request<boolean>({
		auth,
		method: HttpMethod.DELETE,
		path: `${collectionPath({ collectionName })}/snapshots/${encodeURIComponent(snapshotName)}`,
		query: WAIT,
	});
}

async function createPayloadIndex({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<QdrantUpdateResult> {
	return await qdrantClient.request<QdrantUpdateResult>({
		auth,
		method: HttpMethod.PUT,
		path: `${collectionPath({ collectionName })}/index`,
		query: WAIT,
		body,
	});
}

async function deletePayloadIndex({
	auth,
	collectionName,
	fieldName,
}: CollectionParams & { auth: QdrantAuthValue; fieldName: string }): Promise<QdrantUpdateResult> {
	return await qdrantClient.request<QdrantUpdateResult>({
		auth,
		method: HttpMethod.DELETE,
		path: `${collectionPath({ collectionName })}/index/${encodeURIComponent(fieldName)}`,
		query: WAIT,
	});
}

async function upsertPoints({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<QdrantUpdateResult> {
	return await pointsWrite({ auth, collectionName, method: HttpMethod.PUT, subPath: '', body });
}

async function getPoints({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<QdrantRecord[]> {
	return await qdrantClient.request<QdrantRecord[]>({
		auth,
		method: HttpMethod.POST,
		path: `${collectionPath({ collectionName })}/points`,
		body,
	});
}

async function scrollPoints({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<QdrantScrollResult> {
	return await qdrantClient.request<QdrantScrollResult>({
		auth,
		method: HttpMethod.POST,
		path: `${collectionPath({ collectionName })}/points/scroll`,
		body,
	});
}

async function countPoints({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<{ count: number }> {
	return await qdrantClient.request<{ count: number }>({
		auth,
		method: HttpMethod.POST,
		path: `${collectionPath({ collectionName })}/points/count`,
		body,
	});
}

async function deletePoints({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<QdrantUpdateResult> {
	return await pointsWrite({
		auth,
		collectionName,
		method: HttpMethod.POST,
		subPath: '/delete',
		body,
	});
}

async function setPayload({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<QdrantUpdateResult> {
	return await pointsWrite({
		auth,
		collectionName,
		method: HttpMethod.POST,
		subPath: '/payload',
		body,
	});
}

async function overwritePayload({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<QdrantUpdateResult> {
	return await pointsWrite({
		auth,
		collectionName,
		method: HttpMethod.PUT,
		subPath: '/payload',
		body,
	});
}

async function deletePayloadKeys({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<QdrantUpdateResult> {
	return await pointsWrite({
		auth,
		collectionName,
		method: HttpMethod.POST,
		subPath: '/payload/delete',
		body,
	});
}

async function clearPayload({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<QdrantUpdateResult> {
	return await pointsWrite({
		auth,
		collectionName,
		method: HttpMethod.POST,
		subPath: '/payload/clear',
		body,
	});
}

async function updateVectors({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<QdrantUpdateResult> {
	return await pointsWrite({
		auth,
		collectionName,
		method: HttpMethod.PUT,
		subPath: '/vectors',
		body,
	});
}

async function deleteVectors({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<QdrantUpdateResult> {
	return await pointsWrite({
		auth,
		collectionName,
		method: HttpMethod.POST,
		subPath: '/vectors/delete',
		body,
	});
}

async function queryPoints({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<{ points: QdrantScoredPoint[] }> {
	return await qdrantClient.request<{ points: QdrantScoredPoint[] }>({
		auth,
		method: HttpMethod.POST,
		path: `${collectionPath({ collectionName })}/points/query`,
		body,
	});
}

async function queryPointsGroups({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<{ groups: QdrantBody[] }> {
	return await qdrantClient.request<{ groups: QdrantBody[] }>({
		auth,
		method: HttpMethod.POST,
		path: `${collectionPath({ collectionName })}/points/query/groups`,
		body,
	});
}

async function facet({
	auth,
	collectionName,
	body,
}: CollectionBodyParams & { auth: QdrantAuthValue }): Promise<{ hits: QdrantBody[] }> {
	return await qdrantClient.request<{ hits: QdrantBody[] }>({
		auth,
		method: HttpMethod.POST,
		path: `${collectionPath({ collectionName })}/facet`,
		body,
	});
}

function collectionPath({ collectionName }: CollectionParams): string {
	return `/collections/${encodeURIComponent(collectionName)}`;
}

async function pointsWrite({
	auth,
	collectionName,
	method,
	subPath,
	body,
}: CollectionBodyParams & {
	auth: QdrantAuthValue;
	method: HttpMethod;
	subPath: string;
}): Promise<QdrantUpdateResult> {
	return await qdrantClient.request<QdrantUpdateResult>({
		auth,
		method,
		path: `${collectionPath({ collectionName })}/points${subPath}`,
		query: WAIT,
		body,
	});
}

export const qdrantApi = {
	listCollections,
	getCollection,
	collectionExists,
	createCollection,
	updateCollection,
	deleteCollection,
	listAliases,
	listCollectionAliases,
	updateAliases,
	createSnapshot,
	listSnapshots,
	deleteSnapshot,
	createPayloadIndex,
	deletePayloadIndex,
	upsertPoints,
	getPoints,
	scrollPoints,
	countPoints,
	deletePoints,
	setPayload,
	overwritePayload,
	deletePayloadKeys,
	clearPayload,
	updateVectors,
	deleteVectors,
	queryPoints,
	queryPointsGroups,
	facet,
};

const WAIT = { wait: 'true' };

type CollectionParams = { collectionName: string };

type CollectionBodyParams = CollectionParams & { body: QdrantBody };
