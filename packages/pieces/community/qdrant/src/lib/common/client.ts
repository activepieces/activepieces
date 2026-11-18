import { QdrantClient } from '@qdrant/js-client-rest';

import { HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';

import type { QdrantAuthValue, QdrantEnvelope } from './types';

function create({ auth }: { auth: QdrantAuthValue }): QdrantClient {
	return new QdrantClient({
		apiKey: auth.props.key,
		url: auth.props.serverAddress,
	});
}

function baseUrl({ auth }: { auth: QdrantAuthValue }): string {
	const url = new URL(auth.props.serverAddress);
	return `${url.protocol}//${url.hostname}:${url.port || DEFAULT_PORT}`;
}

async function request<T>({
	auth,
	method,
	path,
	query,
	body,
}: RequestParams & { auth: QdrantAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<QdrantEnvelope<T>>({
		method,
		url: `${baseUrl({ auth })}${path}`,
		headers: { 'api-key': auth.props.key },
		queryParams: query,
		body,
	});
	return response.body.result;
}

export const qdrantClient = { create, baseUrl, request };

const DEFAULT_PORT = '6333';

type RequestParams = { method: HttpMethod; path: string; query?: QueryParams; body?: unknown };
