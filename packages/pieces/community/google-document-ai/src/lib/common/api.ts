import { googleDocumentAiClient } from './client';
import { googleDocumentAiUtils } from './utils';

import type {
	GoogleDocumentAiAuthValue,
	GoogleDocumentAiListProcessorsResponse,
	GoogleDocumentAiProcessor,
	GoogleDocumentAiProcessRequest,
	GoogleDocumentAiProcessResponse,
	GoogleDocumentAiResolvedAuth,
} from './types';

async function resolveAuth({
	auth,
}: {
	auth: GoogleDocumentAiAuthValue | undefined;
}): Promise<GoogleDocumentAiResolvedAuth> {
	return await googleDocumentAiClient.resolveAuth({ auth });
}

async function listProcessors({
	auth,
}: {
	auth: GoogleDocumentAiResolvedAuth;
}): Promise<GoogleDocumentAiProcessor[]> {
	const processors: GoogleDocumentAiProcessor[] = [];
	let pageToken: string | undefined;
	do {
		const page = await googleDocumentAiClient.request<GoogleDocumentAiListProcessorsResponse>({
			auth,
			method: 'GET',
			path: `/${googleDocumentAiUtils.parentOf({ auth })}/processors`,
			query: { pageSize: 100, pageToken },
			timeoutMs: METADATA_TIMEOUT_MS,
			isExpected: isListProcessorsResponse,
		});
		processors.push(...(page.processors ?? []));
		pageToken = page.nextPageToken;
	} while (pageToken);
	return processors;
}

async function processDocument({
	auth,
	processorName,
	request,
}: {
	auth: GoogleDocumentAiResolvedAuth;
	processorName: string;
	request: GoogleDocumentAiProcessRequest;
}): Promise<GoogleDocumentAiProcessResponse> {
	if (!request.rawDocument && !request.gcsDocument) {
		throw new Error('process needs a rawDocument or a gcsDocument.');
	}
	return await googleDocumentAiClient.request<GoogleDocumentAiProcessResponse>({
		auth,
		method: 'POST',
		path: `/${processorName}:process`,
		body: request,
		timeoutMs: PROCESS_TIMEOUT_MS,
		timeoutHint: 'For large files, select fewer pages or turn on Imageless Mode.',
		isExpected: isProcessResponse,
	});
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isProcessor(value: unknown): value is GoogleDocumentAiProcessor {
	return isRecord(value) && typeof value['name'] === 'string';
}

function isListProcessorsResponse(value: unknown): value is GoogleDocumentAiListProcessorsResponse {
	if (!isRecord(value)) return false;
	const processors = value['processors'];
	const nextPageToken = value['nextPageToken'];
	return (
		(processors === undefined || (Array.isArray(processors) && processors.every(isProcessor))) &&
		(nextPageToken === undefined || typeof nextPageToken === 'string')
	);
}

function isProcessResponse(value: unknown): value is GoogleDocumentAiProcessResponse {
	if (!isRecord(value)) return false;
	const document = value['document'];
	const humanReviewStatus = value['humanReviewStatus'];
	return (
		(document === undefined || isRecord(document)) &&
		(humanReviewStatus === undefined || isRecord(humanReviewStatus))
	);
}

export const googleDocumentAiApi = { resolveAuth, listProcessors, processDocument };

const METADATA_TIMEOUT_MS = 30_000;
const PROCESS_TIMEOUT_MS = 120_000;
