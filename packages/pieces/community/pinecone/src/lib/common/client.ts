import { Pinecone } from '@pinecone-database/pinecone';

import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

import type { PineconeAuthValue } from './types';

function create({ auth }: { auth: PineconeAuthValue }): Pinecone {
	if (!auth.props || !auth.props.apiKey) {
		throw new Error('Invalid authentication: API key is required');
	}
	return new Pinecone({ apiKey: auth.props.apiKey });
}

function baseUrl(): string {
	return CONTROL_PLANE_URL;
}

async function request<T>({
	auth,
	method,
	url = CONTROL_PLANE_URL,
	path,
	query,
	body,
	apiVersion = API_VERSION,
}: RequestParams & { auth: PineconeAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${url}${path}`,
		headers: { 'Api-Key': auth.props.apiKey, 'X-Pinecone-Api-Version': apiVersion },
		queryParams: query,
		body,
	});
	return response.body;
}

export const pineconeClient = { create, baseUrl, request, apiVersion: () => API_VERSION };

const CONTROL_PLANE_URL = 'https://api.pinecone.io';
const API_VERSION = '2026-07';

type RequestParams = {
	method: HttpMethod;
	url?: string;
	path: string;
	query?: QueryParams;
	body?: unknown;
	apiVersion?: string;
};
