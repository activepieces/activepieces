import { randomUUID } from 'crypto';

import { Runware } from '@runware/sdk-js';

import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

import type { RunwareAuthValue, RunwareTask } from './types';

function create({ auth }: { auth: RunwareAuthValue }) {
	return new Runware({ apiKey: auth.secret_text });
}

function baseUrl(): string {
	return 'https://api.runware.ai/v1';
}

async function request<T>({ auth, task }: RequestParams & { auth: RunwareAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method: HttpMethod.POST,
		url: baseUrl(),
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: auth.secret_text,
		},
		body: [{ taskUUID: randomUUID(), ...task }],
	});
	return response.body;
}

export const runwareClient = { create, baseUrl, request };

type RequestParams = { task: RunwareTask };
