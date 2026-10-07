import { S3ServiceException } from '@aws-sdk/client-s3';

async function call<T>({ request, key }: { request: () => Promise<T>; key?: string }): Promise<T> {
	try {
		return await request();
	} catch (error) {
		throw toActionError({ error, key });
	}
}

function copySource({
	bucket,
	key,
	versionId,
}: {
	bucket: string;
	key: string;
	versionId?: string;
}): string {
	const source = encodeURIComponent(`${bucket}/${key}`);
	return versionId ? `${source}?versionId=${encodeURIComponent(versionId)}` : source;
}

function isTextContentType(contentType: string | undefined): boolean {
	if (!contentType) {
		return false;
	}
	const type = contentType.toLowerCase();
	return type.startsWith('text/') || TEXT_TYPE_MARKERS.some((marker) => type.includes(marker));
}

function toIso(date: Date | undefined): string | null {
	return date ? date.toISOString() : null;
}

function toActionError({ error, key }: { error: unknown; key?: string }): Error {
	if (!(error instanceof S3ServiceException)) {
		return error instanceof Error ? error : new Error(String(error));
	}
	const status = error.$metadata.httpStatusCode;
	const target = key ? ` "${key}"` : '';
	if (status === 404 || error.name === 'NoSuchKey' || error.name === 'NotFound') {
		return new Error(`File${target} was not found in the bucket (${error.name}).`);
	}
	if (status === 403) {
		return new Error(
			`Access denied${
				target ? ` for${target}` : ''
			}: the connection's IAM policy does not allow this S3 operation (${
				error.message || error.name
			}).`,
		);
	}
	if (status === 412) {
		return new Error(`A file already exists at${target} and overwriting was not allowed.`);
	}
	return new Error(`${error.name}: ${error.message}`);
}

const TEXT_TYPE_MARKERS = [
	'json',
	'xml',
	'csv',
	'yaml',
	'javascript',
	'markdown',
	'ndjson',
	'x-www-form-urlencoded',
];

export const s3AiCommon = { call, copySource, isTextContentType, toIso };
