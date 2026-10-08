import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Readable } from 'node:stream';
import { codaApi } from './client';

const EXPORT_WAIT_MS = 60_000;
const EXPORT_POLL_DELAYS_MS = [1_000, 2_000, 3_000];
const EXPORT_POLL_STEP_MS = 3_000;
const DOWNLOAD_TIMEOUT_MS = 30_000;
const MAX_CONTENT_BYTES = 5 * 1024 * 1024;

async function startExport({ token, pagePath, format }: { token: string; pagePath: string; format: ExportFormat }): Promise<ExportStatus> {
	return codaApi.request<ExportStatus>({
		token,
		method: HttpMethod.POST,
		path: `${pagePath}/export`,
		operation: 'start page export',
		body: { outputFormat: format },
	});
}

async function getExportStatus({
	token,
	pagePath,
	exportId,
	timeoutMs,
}: {
	token: string;
	pagePath: string;
	exportId: string;
	timeoutMs?: number;
}): Promise<ExportStatus> {
	return codaApi.request<ExportStatus>({
		token,
		method: HttpMethod.GET,
		path: `${pagePath}/export/${codaApi.pathSegment({ value: exportId, label: 'Export ID' })}`,
		operation: 'check page export',
		timeoutMs,
		retryRateLimits: timeoutMs === undefined,
	});
}

async function waitForExport({
	token,
	pagePath,
	exportId,
	wait = codaApi.sleep,
	now = Date.now,
}: {
	token: string;
	pagePath: string;
	exportId: string;
	wait?: (ms: number) => Promise<void>;
	now?: () => number;
}): Promise<ExportStatus | undefined> {
	codaApi.pathSegment({ value: exportId, label: 'Export ID' });
	const deadline = now() + EXPORT_WAIT_MS;
	for (let attempt = 0; ; attempt++) {
		const budget = codaApi.pollRequestBudget({ deadline, now });
		if (budget === undefined) {
			return undefined;
		}
		const status = await pollExport({ token, pagePath, exportId, timeoutMs: budget });
		if (status?.status === 'complete') {
			return status;
		}
		if (status?.status === 'failed') {
			throw new Error(`Coda could not export the page: ${status.error ?? 'no reason given'}`);
		}
		const remaining = deadline - now();
		if (remaining <= 0) {
			return undefined;
		}
		await wait(Math.min(EXPORT_POLL_DELAYS_MS[attempt] ?? EXPORT_POLL_STEP_MS, remaining));
	}
}

async function pollExport(params: { token: string; pagePath: string; exportId: string; timeoutMs: number }): Promise<ExportStatus | undefined> {
	try {
		const poll = await codaApi.withinBudget({ task: getExportStatus(params), ms: params.timeoutMs });
		return poll.done ? poll.value : undefined;
	} catch (error) {
		if (codaApi.statusOf(error) !== 404 && codaApi.isTransientPollError(error)) {
			return undefined;
		}
		throw error;
	}
}

async function downloadText({ url, format }: { url: string; format: ExportFormat }): Promise<{ content: string; truncated: boolean }> {
	if (!url.startsWith('https://')) {
		throw new Error('Coda returned an export link that is not HTTPS, so it was not downloaded.');
	}
	const response = await httpClient.sendRequest<Readable>({
		method: HttpMethod.GET,
		url,
		responseType: 'stream',
		timeout: DOWNLOAD_TIMEOUT_MS,
		headers: { Accept: format === 'html' ? 'text/html, text/plain, */*' : 'text/markdown, text/plain, */*' },
	});
	return readCapped({ stream: response.body, maxBytes: MAX_CONTENT_BYTES, timeoutMs: DOWNLOAD_TIMEOUT_MS });
}

function readCapped({ stream, maxBytes, timeoutMs }: { stream: Readable; maxBytes: number; timeoutMs: number }): Promise<{ content: string; truncated: boolean }> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		let size = 0;
		let settled = false;
		const finish = (result: { content: string; truncated: boolean } | Error) => {
			if (settled) {
				return;
			}
			settled = true;
			clearTimeout(timer);
			if (result instanceof Error) {
				reject(result);
			} else {
				resolve(result);
			}
		};
		const timer = setTimeout(() => {
			stream.destroy();
			finish(new Error('Downloading the page export took longer than 30 seconds.'));
		}, timeoutMs);
		stream.on('data', (chunk: Buffer | string) => {
			const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
			const room = maxBytes - size;
			if (buffer.length > room) {
				chunks.push(buffer.subarray(0, room));
				size += room;
				stream.destroy();
				finish({ content: Buffer.concat(chunks).toString('utf8'), truncated: true });
				return;
			}
			chunks.push(buffer);
			size += buffer.length;
		});
		stream.on('end', () => finish({ content: Buffer.concat(chunks).toString('utf8'), truncated: false }));
		stream.on('error', (error) => finish(error));
	});
}

export const pageExport = {
	startExport,
	getExportStatus,
	waitForExport,
	downloadText,
	readCapped,
	MAX_CONTENT_BYTES,
};

export type ExportFormat = 'markdown' | 'html';

export type ExportStatus = {
	id: string;
	status: 'inProgress' | 'failed' | 'complete' | string;
	href?: string;
	downloadLink?: string;
	error?: string;
};
