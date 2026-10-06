import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { ApFile, FilesService } from '@activepieces/pieces-framework';
import { zeroCodeKitApi, ZEROCODEKIT_BASE_URL, ZEROCODEKIT_TIMEOUT_MS, ZeroCodeKitRequest } from './client';

export const zeroCodeKitFiles = {
    postForBinary,
    download,
    assertZeroCodeKitUrl,
    save,
    saveBase64,
    toBase64,
    withExtension,
};

async function postForBinary({ apiKey, path, body, timeoutMs }: ZeroCodeKitRequest): Promise<Buffer> {
    try {
        const response = await httpClient.sendRequest<ArrayBuffer>({
            method: HttpMethod.POST,
            url: `${ZEROCODEKIT_BASE_URL}${path}`,
            headers: { auth: apiKey },
            body: body ?? {},
            responseType: 'arraybuffer',
            timeout: timeoutMs ?? zeroCodeKitApi.timeoutFor(path),
        });
        return Buffer.from(response.body);
    } catch (error) {
        throw new Error(describeBinaryError(error));
    }
}

async function download({ url, failure, timeoutMs }: DownloadParams): Promise<Buffer> {
    const safeUrl = assertZeroCodeKitUrl(url);
    const response = await sendDownload({ url: safeUrl, failure, timeoutMs });
    if (response.status >= 300 && response.status < 400) {
        throw new Error(`${failure} 0CodeKit answered with a redirect (${response.status}), which is not followed.`);
    }
    return Buffer.from(response.body);
}

async function sendDownload({ url, failure, timeoutMs }: DownloadParams) {
    try {
        return await httpClient.sendRequest<ArrayBuffer>({
            method: HttpMethod.GET,
            url,
            responseType: 'arraybuffer',
            followRedirects: false,
            timeout: timeoutMs ?? ZEROCODEKIT_TIMEOUT_MS.file,
        });
    } catch (error) {
        throw new Error(zeroCodeKitApi.describe({ error, fallback: failure }));
    }
}

function assertZeroCodeKitUrl(url: string): string {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error('0CodeKit returned a download link that is not a valid URL.');
    }
    const host = parsed.hostname.toLowerCase();
    const trusted = ZEROCODEKIT_DOWNLOAD_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
    if (parsed.protocol !== 'https:' || !trusted || parsed.port !== '' || parsed.username !== '' || parsed.password !== '') {
        throw new Error(
            `Refusing to download from ${parsed.protocol}//${host}: only https links on 0CodeKit domains (${ZEROCODEKIT_DOWNLOAD_DOMAINS.join(', ')}) are downloaded.`,
        );
    }
    return parsed.toString();
}

function describeBinaryError(error: unknown): string {
    const fallback = 'The request to 0CodeKit failed.';
    if (!(error instanceof HttpError)) {
        return zeroCodeKitApi.describe({ error, fallback });
    }
    const parsed = parseBinaryBody(error.response.body);
    if (parsed === undefined) {
        return zeroCodeKitApi.describe({ error, fallback });
    }
    return zeroCodeKitApi.describe({
        error: new HttpError({}, { status: error.response.status, responseBody: parsed }),
        fallback,
    });
}

function parseBinaryBody(body: unknown): unknown {
    const text = Buffer.isBuffer(body)
        ? body.toString('utf8')
        : body instanceof ArrayBuffer
          ? Buffer.from(body).toString('utf8')
          : typeof body === 'string'
            ? body
            : undefined;
    if (text === undefined) {
        return undefined;
    }
    try {
        return JSON.parse(text);
    } catch {
        return { errorMessage: text.slice(0, 300) };
    }
}

async function save({
    files,
    fileName,
    data,
}: {
    files: FilesService;
    fileName: string;
    data: Buffer;
}): Promise<SavedFile> {
    const file = await files.write({ fileName, data });
    return { file, file_name: fileName, size_bytes: data.length };
}

async function saveBase64({
    files,
    fileName,
    base64,
}: {
    files: FilesService;
    fileName: string;
    base64: string;
}): Promise<SavedFile> {
    const cleaned = base64.replace(/^data:[^;]+;base64,/, '');
    return save({ files, fileName, data: Buffer.from(cleaned, 'base64') });
}

function toBase64(file: ApFile): string {
    return file.base64;
}

function withExtension({ name, extension }: { name: string | undefined; extension: string }): string {
    const base = (name ?? '').trim() || 'file';
    return base.toLowerCase().endsWith(`.${extension}`) ? base : `${base}.${extension}`;
}

const ZEROCODEKIT_DOWNLOAD_DOMAINS = ['0codekit.com', '1saas.co'];

type DownloadParams = {
    url: string;
    failure: string;
    timeoutMs?: number;
};

export type SavedFile = {
    file: string;
    file_name: string;
    size_bytes: number;
};
