import { HttpError, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/pieces-framework';

import { pineconeClient } from './client';

import type {
	PineconeAuthValue,
	PineconeLegacyCreateIndexRequest,
	PineconeLegacyIndex,
	PineconeLegacyIndexResponse,
	PineconeNamespaceAlias,
	PineconeNamespaceAliasList,
} from './types';

async function indexDataRequest<T>({
	auth,
	indexName,
	method,
	path,
	query,
	body,
}: IndexDataRequestParams & { auth: PineconeAuthValue }): Promise<T> {
	const index = await pineconeClient.create({ auth }).indexes.describe(indexName);
	return await pineconeClient.request<T>({
		auth,
		method,
		url: `https://${index.host}`,
		path,
		query,
		body,
	});
}

async function listNamespaceAliases({
	auth,
	indexName,
	limit,
	paginationToken,
	prefix,
	targetNamespace,
}: ListNamespaceAliasesParams & { auth: PineconeAuthValue }): Promise<PineconeNamespaceAliasList> {
	return await indexDataRequest<PineconeNamespaceAliasList>({
		auth,
		indexName,
		method: HttpMethod.GET,
		path: '/namespace-aliases',
		query: {
			...(limit !== undefined ? { limit: String(limit) } : {}),
			...(paginationToken !== undefined ? { paginationToken } : {}),
			...(prefix !== undefined ? { prefix } : {}),
			...(targetNamespace !== undefined ? { target_namespace: targetNamespace } : {}),
		},
	});
}

async function createNamespaceAlias({
	auth,
	indexName,
	aliasName,
	targetNamespace,
}: NamespaceAliasParams & {
	targetNamespace: string;
	auth: PineconeAuthValue;
}): Promise<PineconeNamespaceAlias> {
	return await indexDataRequest<PineconeNamespaceAlias>({
		auth,
		indexName,
		method: HttpMethod.POST,
		path: '/namespace-aliases',
		body: { name: aliasName, target_namespace: targetNamespace },
	});
}

async function getNamespaceAlias({
	auth,
	indexName,
	aliasName,
}: NamespaceAliasParams & { auth: PineconeAuthValue }): Promise<PineconeNamespaceAlias> {
	return await indexDataRequest<PineconeNamespaceAlias>({
		auth,
		indexName,
		method: HttpMethod.GET,
		path: `/namespace-aliases/${encodeURIComponent(aliasName)}`,
	});
}

async function repointNamespaceAlias({
	auth,
	indexName,
	aliasName,
	targetNamespace,
}: NamespaceAliasParams & {
	targetNamespace: string;
	auth: PineconeAuthValue;
}): Promise<PineconeNamespaceAlias> {
	return await indexDataRequest<PineconeNamespaceAlias>({
		auth,
		indexName,
		method: HttpMethod.PATCH,
		path: `/namespace-aliases/${encodeURIComponent(aliasName)}`,
		body: { target_namespace: targetNamespace },
	});
}

async function deleteNamespaceAlias({
	auth,
	indexName,
	aliasName,
}: NamespaceAliasParams & { auth: PineconeAuthValue }): Promise<void> {
	await indexDataRequest<unknown>({
		auth,
		indexName,
		method: HttpMethod.DELETE,
		path: `/namespace-aliases/${encodeURIComponent(aliasName)}`,
	});
}

async function createLegacyIndex({
	auth,
	request,
	waitUntilReady,
	suppressConflicts,
}: {
	auth: PineconeAuthValue;
	request: PineconeLegacyCreateIndexRequest;
	waitUntilReady: boolean;
	suppressConflicts: boolean;
}): Promise<PineconeLegacyIndex | undefined> {
	const { data, error } = await tryCatch(() =>
		pineconeClient.request<PineconeLegacyIndexResponse>({
			auth,
			method: HttpMethod.POST,
			path: '/indexes',
			apiVersion: LEGACY_INDEX_API_VERSION,
			body: toLegacyCreateIndexBody(request),
		}),
	);
	if (error) {
		if (suppressConflicts && error instanceof HttpError && error.response.status === 409) {
			return undefined;
		}
		throw error;
	}
	if (waitUntilReady) {
		return await waitUntilLegacyIndexReady({ auth, indexName: request.name });
	}
	return toLegacyIndex(data);
}

async function describeLegacyIndex({
	auth,
	indexName,
}: {
	auth: PineconeAuthValue;
	indexName: string;
}): Promise<PineconeLegacyIndex> {
	const index = await pineconeClient.request<PineconeLegacyIndexResponse>({
		auth,
		method: HttpMethod.GET,
		path: `/indexes/${encodeURIComponent(indexName)}`,
		apiVersion: LEGACY_INDEX_API_VERSION,
	});
	return toLegacyIndex(index);
}

async function listLegacyIndexes({
	auth,
}: {
	auth: PineconeAuthValue;
}): Promise<{ indexes?: PineconeLegacyIndex[] }> {
	const response = await pineconeClient.request<{ indexes?: PineconeLegacyIndexResponse[] }>({
		auth,
		method: HttpMethod.GET,
		path: '/indexes',
		apiVersion: LEGACY_INDEX_API_VERSION,
	});
	return { indexes: response.indexes?.map(toLegacyIndex) };
}

export const pineconeApi = {
	createLegacyIndex,
	describeLegacyIndex,
	listLegacyIndexes,
	listNamespaceAliases,
	createNamespaceAlias,
	getNamespaceAlias,
	repointNamespaceAlias,
	deleteNamespaceAlias,
};

async function waitUntilLegacyIndexReady({
	auth,
	indexName,
}: {
	auth: PineconeAuthValue;
	indexName: string;
}): Promise<PineconeLegacyIndex> {
	const index = await describeLegacyIndex({ auth, indexName });
	if (index.status.ready) {
		return index;
	}
	await new Promise((resolve) => setTimeout(resolve, 1000));
	return await waitUntilLegacyIndexReady({ auth, indexName });
}

function toLegacyCreateIndexBody(request: PineconeLegacyCreateIndexRequest): object {
	const { serverless, pod } = request.spec;
	return {
		name: request.name,
		dimension: request.dimension,
		metric: request.metric,
		deletion_protection: request.deletionProtection,
		tags: request.tags,
		vector_type: request.vectorType,
		spec: {
			...(serverless !== undefined
				? {
						serverless: {
							cloud: serverless.cloud,
							region: serverless.region,
							source_collection: serverless.sourceCollection,
						},
				  }
				: {}),
			...(pod !== undefined
				? {
						pod: {
							environment: pod.environment,
							pod_type: pod.podType,
							replicas: pod.replicas,
							shards: pod.shards,
							pods: pod.pods,
							source_collection: pod.sourceCollection,
						},
				  }
				: {}),
		},
	};
}

function toLegacyIndex(index: PineconeLegacyIndexResponse): PineconeLegacyIndex {
	const { byoc, pod, serverless } = index.spec;
	return {
		name: index.name,
		dimension: index.dimension,
		metric: index.metric,
		host: index.host,
		privateHost: index.private_host,
		deletionProtection: index.deletion_protection,
		tags: index.tags,
		embed: index.embed && {
			model: index.embed.model,
			metric: index.embed.metric,
			dimension: index.embed.dimension,
			vectorType: index.embed.vector_type,
			fieldMap: index.embed.field_map,
			readParameters: index.embed.read_parameters,
			writeParameters: index.embed.write_parameters,
		},
		spec: {
			byoc: byoc && { environment: byoc.environment },
			pod: pod && {
				environment: pod.environment,
				replicas: pod.replicas,
				shards: pod.shards,
				podType: pod.pod_type,
				pods: pod.pods,
				metadataConfig: pod.metadata_config && { indexed: pod.metadata_config.indexed },
				sourceCollection: pod.source_collection,
			},
			serverless: serverless && {
				cloud: serverless.cloud,
				region: serverless.region,
				sourceCollection: serverless.source_collection,
			},
		},
		status: { ready: index.status.ready, state: index.status.state },
		vectorType: index.vector_type,
	};
}

const LEGACY_INDEX_API_VERSION = '2026-04';

type IndexDataRequestParams = {
	indexName: string;
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
};

type ListNamespaceAliasesParams = {
	indexName: string;
	limit?: number;
	paginationToken?: string;
	prefix?: string;
	targetNamespace?: string;
};

type NamespaceAliasParams = { indexName: string; aliasName: string };
