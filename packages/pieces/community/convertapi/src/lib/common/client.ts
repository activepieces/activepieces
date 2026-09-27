import { httpClient, HttpError, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { FilesService } from '@activepieces/pieces-framework';
import {
    ConvertApiConversionResponse,
    ConvertApiErrorBody,
    ConvertApiParameter,
    ConvertApiResultFile,
    ConvertApiUploadResponse,
    InputFile,
    StoredFile,
} from './types';

export const convertApi = {
    upload,
    convert,
    download,
    deleteFiles,
    convertFiles,
    checkToken,
    toValueParameters,
    describeError,
};

export const CONVERTAPI_BASE_URL = 'https://v2.convertapi.com';
export const MAX_TIMEOUT_SECONDS = 360;
export const DOWNLOAD_TIMEOUT_MS = 60_000;
export const DELETE_TIMEOUT_MS = 15_000;
export const UPLOAD_TIMEOUT_MS = 120_000;
export const STEP_BUDGET_MS = 540_000;

async function upload({ apiKey, file, timeoutMs }: UploadParams): Promise<string> {
    const response = await sendOrThrow<ConvertApiUploadResponse>({
        method: HttpMethod.POST,
        url: `${CONVERTAPI_BASE_URL}/upload`,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/octet-stream',
        },
        queryParams: { filename: file.filename },
        body: file.data,
        timeout: timeoutMs,
    });
    if (typeof response.FileId !== 'string' || response.FileId.length === 0) {
        throw new Error(`ConvertAPI did not return a file ID after uploading "${file.filename}".`);
    }
    return response.FileId;
}

async function convert({ apiKey, from, to, parameters, timeoutMs }: ConvertParams): Promise<ConvertApiConversionResponse> {
    return sendOrThrow<ConvertApiConversionResponse>({
        method: HttpMethod.POST,
        url: `${CONVERTAPI_BASE_URL}/convert/${encodeURIComponent(from)}/to/${encodeURIComponent(to)}`,
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        body: { Parameters: withExecutionParameters(parameters) },
        timeout: timeoutMs ?? (MAX_TIMEOUT_SECONDS + 30) * 1000,
    });
}

async function download({ url, timeoutMs }: { url: string; timeoutMs?: number }): Promise<Buffer> {
    if (!isConvertApiUrl(url)) {
        throw new Error('ConvertAPI returned a download link outside convertapi.com, so it was not followed.');
    }
    const response = await sendOrThrow<unknown>({
        method: HttpMethod.GET,
        url,
        responseType: 'arraybuffer',
        followRedirects: false,
        timeout: timeoutMs ?? DOWNLOAD_TIMEOUT_MS,
    });
    if (!Buffer.isBuffer(response)) {
        throw new Error('ConvertAPI returned an unreadable file.');
    }
    return response;
}

async function deleteFiles({ fileIds }: { fileIds: string[] }): Promise<string[]> {
    const results = await Promise.allSettled(
        fileIds.map((fileId) =>
            httpClient.sendRequest({
                method: HttpMethod.DELETE,
                url: `${CONVERTAPI_BASE_URL}/d/${encodeURIComponent(fileId)}`,
                timeout: DELETE_TIMEOUT_MS,
            }),
        ),
    );
    return fileIds.filter((_, index) => results[index].status === 'rejected');
}

async function convertFiles({
    apiKey,
    from,
    to,
    fileInputs,
    parameters,
    files,
}: ConvertFilesParams): Promise<ConversionOutput> {
    const fileIdsToDelete: string[] = [];
    const deadline = Date.now() + STEP_BUDGET_MS;
    try {
        const fileParameters: ConvertApiParameter[] = [];
        for (const input of fileInputs) {
            const ids: string[] = [];
            for (const file of input.files) {
                const id = await upload({ apiKey, file, timeoutMs: remainingMs({ deadline, cap: UPLOAD_TIMEOUT_MS }) });
                fileIdsToDelete.push(id);
                ids.push(id);
            }
            fileParameters.push(toFileParameter({ name: input.name, ids, multiple: input.multiple }));
        }

        const response = await convert({
            apiKey,
            from,
            to,
            parameters: [...fileParameters, ...parameters],
            timeoutMs: remainingMs({ deadline, cap: (MAX_TIMEOUT_SECONDS + 30) * 1000 }),
        });
        const resultFiles = response.Files ?? [];
        if (resultFiles.length === 0) {
            throw new Error('ConvertAPI finished the conversion but returned no files.');
        }
        fileIdsToDelete.push(
            ...resultFiles.flatMap((resultFile) => (resultFile.FileId ? [resultFile.FileId] : [])),
        );

        const downloadTimeoutMs = remainingMs({ deadline, cap: DOWNLOAD_TIMEOUT_MS });
        const stored = await Promise.all(
            resultFiles.map((resultFile) => storeResultFile({ resultFile, files, timeoutMs: downloadTimeoutMs })),
        );
        return {
            files: stored,
            conversion_cost: typeof response.ConversionCost === 'number' ? response.ConversionCost : null,
        };
    } finally {
        const notDeleted = await deleteFiles({ fileIds: fileIdsToDelete });
        if (notDeleted.length > 0) {
            console.warn(
                `[convertapi] Could not delete ${notDeleted.length} file(s) from ConvertAPI after the step: ${notDeleted.join(', ')}. ConvertAPI removes stored files automatically after a few hours.`,
            );
        }
    }
}

async function checkToken({ apiKey }: { apiKey: string }): Promise<TokenCheck> {
    try {
        await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${CONVERTAPI_BASE_URL}/convert/pdf/to/merge`,
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            body: { Parameters: [] },
        });
        return { valid: true };
    } catch (error) {
        const status = statusOf(error);
        if (status === 401) {
            return {
                valid: false,
                error: 'ConvertAPI rejected this API token. Copy an active token from https://www.convertapi.com/a/authentication and try again.',
            };
        }
        if (status !== undefined && status >= 400 && status < 500) {
            return { valid: true };
        }
        return {
            valid: false,
            error: `Could not reach ConvertAPI to check this token: ${describeError(error)}`,
        };
    }
}

function withExecutionParameters(parameters: ConvertApiParameter[]): ConvertApiParameter[] {
    const reserved = new Set(RESERVED_PARAMETER_NAMES.map((name) => name.toLowerCase()));
    return [
        ...parameters.filter((parameter) => !reserved.has(parameter.Name.toLowerCase())),
        { Name: 'StoreFile', Value: 'true' },
        { Name: 'Timeout', Value: String(MAX_TIMEOUT_SECONDS) },
    ];
}

function toFileParameter({ name, ids, multiple }: { name: string; ids: string[]; multiple: boolean }): ConvertApiParameter {
    if (multiple) {
        return { Name: name, FileValues: ids.map((id) => ({ Id: id })) };
    }
    return { Name: name, FileValue: { Id: ids[0] } };
}

function toValueParameters(values: Record<string, unknown>): ConvertApiParameter[] {
    return Object.entries(values).flatMap(([name, value]) => {
        if (value === undefined || value === null || value === '') {
            return [];
        }
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return [{ Name: name, Value: String(value) }];
        }
        return [];
    });
}

async function storeResultFile({
    resultFile,
    files,
    timeoutMs,
}: {
    resultFile: ConvertApiResultFile;
    files: FilesService;
    timeoutMs: number;
}): Promise<StoredFile> {
    const url = resultFile.Url ?? resultFile.FileUrl;
    if (url === undefined || url.length === 0) {
        throw new Error(`ConvertAPI did not return a download link for "${resultFile.FileName}".`);
    }
    const data = await download({ url, timeoutMs });
    const file = await files.write({ fileName: resultFile.FileName, data });
    return {
        file,
        file_name: resultFile.FileName,
        file_extension: resultFile.FileExt ?? null,
        file_size: typeof resultFile.FileSize === 'number' ? resultFile.FileSize : data.length,
    };
}

async function sendOrThrow<T>(request: HttpRequest): Promise<T> {
    try {
        const response = await httpClient.sendRequest<T>(request);
        return response.body;
    } catch (error) {
        throw new Error(describeError(error));
    }
}

function remainingMs({ deadline, cap }: { deadline: number; cap: number }): number {
    const left = deadline - Date.now();
    if (left <= 0) {
        throw new Error('ConvertAPI took too long: there is not enough time left in this step to finish. Try smaller files or fewer pages.');
    }
    return Math.min(cap, left);
}

function isConvertApiUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        return parsed.protocol === 'https:' && (host === 'convertapi.com' || host.endsWith('.convertapi.com'));
    } catch {
        return false;
    }
}

function statusOf(error: unknown): number | undefined {
    if (error instanceof HttpError) {
        return error.response.status;
    }
    return undefined;
}

function readErrorBody(error: HttpError): ConvertApiErrorBody {
    const body = parseBody(error.response.body);
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return typeof body === 'string' && body.length > 0 ? { Message: body } : {};
    }
    const code = 'Code' in body ? body.Code : undefined;
    const message = 'Message' in body ? body.Message : undefined;
    return {
        Code: typeof code === 'number' ? code : undefined,
        Message: typeof message === 'string' ? message : undefined,
    };
}

function parseBody(body: unknown): unknown {
    if (typeof body !== 'string') {
        return body;
    }
    try {
        return JSON.parse(body);
    } catch {
        return body;
    }
}

function describeError(error: unknown): string {
    if (!(error instanceof HttpError)) {
        return error instanceof Error ? error.message : String(error);
    }
    const status = error.response.status;
    const { Code, Message } = readErrorBody(error);
    const detail = [Message, Code === undefined ? undefined : `code ${Code}`]
        .filter((part) => part !== undefined)
        .join(', ');
    const base = `ConvertAPI error (HTTP ${status})${detail.length > 0 ? `: ${detail}` : ''}`;
    if (status === 401) {
        return `${base}. Check that your API token is active.`;
    }
    if (status === 403) {
        return `${base}. Your ConvertAPI account may be out of conversions.`;
    }
    if (status === 503) {
        return `${base}. ConvertAPI limits how many conversions run at the same time on your plan (the Developer plan allows one). Wait for other conversions to finish, then run the step again.`;
    }
    return base;
}

const RESERVED_PARAMETER_NAMES = ['StoreFile', 'Timeout', 'Secret', 'Token'];

type UploadParams = {
    apiKey: string;
    file: InputFile;
    timeoutMs?: number;
};

type ConvertParams = {
    apiKey: string;
    from: string;
    to: string;
    parameters: ConvertApiParameter[];
    timeoutMs?: number;
};

type TokenCheck = { valid: true } | { valid: false; error: string };

export type FileInput = {
    name: string;
    files: InputFile[];
    multiple: boolean;
};

export type ConvertFilesParams = {
    apiKey: string;
    from: string;
    to: string;
    fileInputs: FileInput[];
    parameters: ConvertApiParameter[];
    files: FilesService;
};

export type ConversionOutput = {
    files: StoredFile[];
    conversion_cost: number | null;
};
