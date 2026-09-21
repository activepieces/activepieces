import { Client } from '@microsoft/microsoft-graph-client';

const batchChunkSize = 20;
const maxRetryDelayMs = 15000;

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(response: GraphBatchResponse): number {
	const retryAfter = response.headers?.['Retry-After'] ?? response.headers?.['retry-after'];
	const seconds = retryAfter ? Number(retryAfter) : NaN;
	if (Number.isFinite(seconds) && seconds > 0) {
		return Math.min(seconds * 1000, maxRetryDelayMs);
	}
	return 2000;
}

async function postChunk({
	client,
	requests,
}: {
	client: Client;
	requests: GraphBatchRequest[];
}): Promise<GraphBatchResponse[]> {
	const response = await client.api('/$batch').post({ requests });
	const responses = (response?.['responses'] ?? []) as GraphBatchResponse[];
	return responses;
}

async function runGraphBatch({
	client,
	requests,
}: {
	client: Client;
	requests: GraphBatchRequest[];
}): Promise<GraphBatchResponse[]> {
	const collected: GraphBatchResponse[] = [];

	for (let index = 0; index < requests.length; index += batchChunkSize) {
		const chunk = requests.slice(index, index + batchChunkSize);
		const responses = await postChunk({ client, requests: chunk });

		const throttled = responses.filter((item) => item.status === 429);
		if (throttled.length === 0) {
			collected.push(...responses);
			continue;
		}

		const waitMs = Math.max(...throttled.map((item) => retryDelayMs(item)));
		await delay(waitMs);

		const retryIds = new Set(throttled.map((item) => item.id));
		const retryRequests = chunk.filter((item) => retryIds.has(item.id));
		const retried = await postChunk({ client, requests: retryRequests });
		const retriedById = new Map(retried.map((item) => [item.id, item]));

		collected.push(...responses.map((item) => retriedById.get(item.id) ?? item));
	}

	return collected;
}

function describeBatchFailure(response: GraphBatchResponse): string {
	const body = response.body;
	if (body && typeof body === 'object' && 'error' in body) {
		const graphError = (body as { error?: { code?: string; message?: string } }).error;
		const parts = [graphError?.code, graphError?.message].filter(Boolean);
		if (parts.length > 0) {
			return parts.join(': ');
		}
	}
	if (typeof body === 'string' && body.length > 0) {
		return body.slice(0, 500);
	}
	return `Microsoft Graph returned HTTP ${response.status} for this item.`;
}

export type GraphBatchRequest = {
	id: string;
	method: string;
	url: string;
	body?: unknown;
	headers?: Record<string, string>;
};

export type GraphBatchResponse = {
	id: string;
	status: number;
	body?: unknown;
	headers?: Record<string, string>;
};

export const graphBatchLimit = batchChunkSize;

export { runGraphBatch, describeBatchFailure };
