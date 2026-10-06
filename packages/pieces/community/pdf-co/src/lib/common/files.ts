import { Readable } from 'node:stream';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pdfCoClient } from './client';

const UPLOAD_TIMEOUT_MS = 60_000;
const DOWNLOAD_TIMEOUT_MS = 60_000;
const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;
const MAX_JSON_BYTES = 20 * 1024 * 1024;
const STORAGE_HOST = /^pdf-temp-files\.s3(\.[a-z0-9-]+)?\.amazonaws\.com$/;

const MIME_TYPES: Record<string, string> = {
	pdf: 'application/pdf',
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	bmp: 'image/bmp',
	tif: 'image/tiff',
	tiff: 'image/tiff',
	webp: 'image/webp',
	doc: 'application/msword',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	ppt: 'application/vnd.ms-powerpoint',
	pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	rtf: 'application/rtf',
	txt: 'text/plain',
	csv: 'text/csv',
	xls: 'application/vnd.ms-excel',
	xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	json: 'application/json',
	xml: 'application/xml',
	html: 'text/html',
};

function isFileLike(value: unknown): value is FileLike {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const record = pdfCoClient.readRecord(value);
	return Buffer.isBuffer(record['data']) && typeof record['filename'] === 'string';
}

function toFileLike(value: unknown): FileLike {
	if (isFileLike(value)) {
		return value;
	}
	throw new Error('The selected file could not be read. Pick a file from an earlier step.');
}

function extensionOf(fileName: string): string {
	const match = /\.([A-Za-z0-9]+)$/.exec(fileName);
	return match === null ? '' : match[1].toLowerCase();
}

function mimeTypeOf(fileName: string): string {
	return MIME_TYPES[extensionOf(fileName)] ?? 'application/octet-stream';
}

function isStorageUrl(url: string): boolean {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return false;
	}
	return (
		parsed.protocol === 'https:' &&
		parsed.username === '' &&
		parsed.password === '' &&
		parsed.port === '' &&
		STORAGE_HOST.test(parsed.hostname)
	);
}

function assertSourceUrl({ url, label }: { url: string; label: string }): string {
	const trimmed = url.trim();
	const withoutCache = trimmed.startsWith('cache:') ? trimmed.slice('cache:'.length) : trimmed;
	let parsed: URL;
	try {
		parsed = new URL(withoutCache);
	} catch {
		throw new Error(`${label} "${trimmed}" is not a valid URL. Use a public http(s) link to the file.`);
	}
	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
		throw new Error(`${label} must start with http:// or https://.`);
	}
	return trimmed;
}

function nonEmptyString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

async function putToPresignedUrl({
	presigned,
	file,
	contentType,
}: {
	presigned: Record<string, unknown>;
	file: FileLike;
	contentType: string;
}): Promise<string> {
	const presignedUrl = nonEmptyString(presigned['presignedUrl']);
	const fileUrl = nonEmptyString(presigned['url']);
	if (presignedUrl === undefined || fileUrl === undefined) {
		throw new Error('PDF.co did not return an upload link for the file.');
	}
	if (!isStorageUrl(presignedUrl) || !isStorageUrl(fileUrl)) {
		throw new Error('PDF.co returned an upload link outside its file storage; the file was not sent.');
	}
	let status: number;
	try {
		const response = await httpClient.sendRequest({
			method: HttpMethod.PUT,
			url: presignedUrl,
			headers: { 'Content-Type': contentType },
			body: file.data,
			timeout: UPLOAD_TIMEOUT_MS,
			followRedirects: false,
		});
		status = response.status;
	} catch (error) {
		const details = pdfCoClient.httpErrorDetails(error);
		const reason = details === undefined ? (error instanceof Error ? error.message : String(error)) : `HTTP ${details.status}`;
		throw new Error(`Uploading "${file.filename}" to PDF.co storage failed: ${reason}.`);
	}
	if (!isSuccessStatus(status)) {
		throw new Error(`Uploading "${file.filename}" to PDF.co storage failed: HTTP ${status}.`);
	}
	return fileUrl;
}

async function uploadToStorage({ apiKey, file }: { apiKey: string; file: unknown }): Promise<UploadResult> {
	const resolved = toFileLike(file);
	const fileName = resolved.filename.trim() === '' ? 'file' : resolved.filename;
	const contentType = mimeTypeOf(fileName);
	const presigned = pdfCoClient.readRecord(
		await pdfCoClient.request<unknown>({
			apiKey,
			method: HttpMethod.GET,
			path: '/v1/file/upload/get-presigned-url',
			queryParams: { name: fileName, contenttype: contentType },
		}),
	);
	const url = await putToPresignedUrl({ presigned, file: resolved, contentType });
	return { url, fileName, presigned };
}

async function uploadFile({ apiKey, file }: { apiKey: string; file: unknown }): Promise<string> {
	const { url } = await uploadToStorage({ apiKey, file });
	return url;
}

function isSuccessStatus(status: number): boolean {
	return status >= 200 && status < 300;
}

async function resolveSource({
	apiKey,
	url,
	file,
	label = 'Source',
}: {
	apiKey: string;
	url: unknown;
	file: unknown;
	label?: string;
}): Promise<string> {
	const urlValue = nonEmptyString(url);
	const hasFile = file !== undefined && file !== null && file !== '';
	if (urlValue !== undefined && hasFile) {
		throw new Error(`${label}: give either a file URL or a file, not both.`);
	}
	if (urlValue !== undefined) {
		return assertSourceUrl({ url: urlValue, label: `${label} URL` });
	}
	if (hasFile) {
		return uploadFile({ apiKey, file });
	}
	throw new Error(`${label}: give a file URL or pick a file.`);
}

function validateSource({ url, file, label = 'Source' }: { url: unknown; file: unknown; label?: string }): void {
	const urlValue = nonEmptyString(url);
	const hasFile = file !== undefined && file !== null && file !== '';
	if (urlValue !== undefined && hasFile) {
		throw new Error(`${label}: give either a file URL or a file, not both.`);
	}
	if (urlValue === undefined && !hasFile) {
		throw new Error(`${label}: give a file URL or pick a file.`);
	}
	if (urlValue !== undefined) {
		assertSourceUrl({ url: urlValue, label: `${label} URL` });
	}
	if (hasFile) {
		toFileLike(file);
	}
}

async function readCapped({ stream, maxBytes, timeoutMs }: { stream: Readable; maxBytes: number; timeoutMs: number }): Promise<Buffer> {
	const chunks: Buffer[] = [];
	let total = 0;
	let tooLarge = false;
	const timer = setTimeout(() => {
		stream.destroy(new Error(`timed out after ${Math.round(timeoutMs / 1000)} s`));
	}, timeoutMs);
	try {
		for await (const chunk of stream) {
			const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
			total += buffer.byteLength;
			if (total > maxBytes) {
				tooLarge = true;
				break;
			}
			chunks.push(buffer);
		}
	} finally {
		clearTimeout(timer);
		if (tooLarge) {
			stream.destroy();
		}
	}
	if (tooLarge) {
		throw new Error(`the file is larger than ${Math.round(maxBytes / 1024 / 1024)} MB`);
	}
	return Buffer.concat(chunks, total);
}

async function downloadStorageFile({ url, maxBytes = MAX_DOWNLOAD_BYTES }: { url: string; maxBytes?: number }): Promise<Buffer> {
	if (!isStorageUrl(url)) {
		throw new Error('the result link is not on PDF.co file storage, so it was not downloaded');
	}
	const deadline = Date.now() + DOWNLOAD_TIMEOUT_MS;
	const response = await httpClient.sendRequest<Readable>({
		method: HttpMethod.GET,
		url,
		headers: { Accept: '*/*' },
		responseType: 'stream',
		timeout: DOWNLOAD_TIMEOUT_MS,
		followRedirects: false,
	});
	if (!isSuccessStatus(response.status)) {
		response.body.destroy();
		throw new Error(`PDF.co file storage answered HTTP ${response.status} instead of the file, so nothing was downloaded`);
	}
	const declared = Number(response.headers?.['content-length'] ?? '');
	if (Number.isFinite(declared) && declared > maxBytes) {
		response.body.destroy();
		throw new Error(`the file is larger than ${Math.round(maxBytes / 1024 / 1024)} MB`);
	}
	return readCapped({ stream: response.body, maxBytes, timeoutMs: Math.max(1, deadline - Date.now()) });
}

function fileNameFromUrl({ url, fallback }: { url: string; fallback: string }): string {
	try {
		const last = new URL(url).pathname.split('/').pop() ?? '';
		const decoded = decodeURIComponent(last);
		return decoded.trim() === '' ? fallback : decoded;
	} catch {
		return fallback;
	}
}

async function saveToFlow({
	files,
	url,
	fileName,
}: {
	files: FlowFiles;
	url: string;
	fileName?: string;
}): Promise<string> {
	const data = await downloadStorageFile({ url });
	const name = nonEmptyString(fileName) ?? fileNameFromUrl({ url, fallback: 'result' });
	return files.write({ fileName: name, data });
}

async function readStorageJson({ url }: { url: string }): Promise<unknown> {
	const data = await downloadStorageFile({ url, maxBytes: MAX_JSON_BYTES });
	try {
		return JSON.parse(data.toString('utf8'));
	} catch {
		throw new Error('the PDF.co result file is not valid JSON');
	}
}

export const pdfCoFiles = {
	resolveSource,
	validateSource,
	uploadFile,
	uploadToStorage,
	isFileLike,
	isStorageUrl,
	downloadStorageFile,
	saveToFlow,
	readStorageJson,
	fileNameFromUrl,
	mimeTypeOf,
	nonEmptyString,
};

export type FileLike = { filename: string; data: Buffer; extension?: string };

type UploadResult = { url: string; fileName: string; presigned: Record<string, unknown> };

export type FlowFiles = { write: (params: { fileName: string; data: Buffer }) => Promise<string> };
