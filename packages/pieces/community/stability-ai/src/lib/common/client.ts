import {
  httpClient,
  HttpHeaders,
  HttpMethod,
  HttpRequest,
  HttpResponse,
} from '@activepieces/pieces-common';
import { FilesService } from '@activepieces/pieces-framework';

class StabilityAiError extends Error {
  readonly status: number | undefined;
  readonly responseBody: unknown;

  constructor({ message, status, responseBody }: StabilityAiErrorParams) {
    super(message);
    this.name = 'StabilityAiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

class StabilityResultTooLargeError extends StabilityAiError {
  constructor({ message }: { message: string }) {
    super({ message, status: undefined, responseBody: undefined });
    this.name = 'StabilityResultTooLargeError';
  }
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey.trim()}`,
    'stability-client-id': CLIENT_ID,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function decodeBody(body: unknown): unknown {
  const text = Buffer.isBuffer(body) ? body.toString('utf8') : body;
  if (typeof text !== 'string') {
    return text;
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function describeVendorBody(body: unknown): { name?: string; detail?: string } {
  if (typeof body === 'string') {
    return { detail: body.slice(0, MAX_RAW_ERROR_LENGTH) };
  }
  if (!isRecord(body)) {
    return {};
  }
  const name = typeof body['name'] === 'string' ? body['name'] : undefined;
  const errors = Array.isArray(body['errors'])
    ? body['errors'].filter((entry): entry is string => typeof entry === 'string')
    : [];
  if (errors.length > 0) {
    return { name, detail: errors.join('; ') };
  }
  if (typeof body['message'] === 'string') {
    return { name, detail: body['message'] };
  }
  return { name, detail: JSON.stringify(body).slice(0, MAX_RAW_ERROR_LENGTH) };
}

function appendHint({ message, hint }: { message: string; hint: string }): string {
  const trimmed = message.trimEnd();
  const separator = /[.!?]$/.test(trimmed) ? ' ' : '. ';
  return `${trimmed}${separator}${hint}`;
}

function readHttpFailure(error: unknown): { status: number; body: unknown } | null {
  if (!isRecord(error)) {
    return null;
  }
  const response = error['response'];
  if (!isRecord(response) || typeof response['status'] !== 'number') {
    return null;
  }
  return { status: response['status'], body: response['body'] };
}

function toStabilityError({ error, timeoutMs, charged }: { error: unknown; timeoutMs: number; charged: boolean }): StabilityAiError {
  if (error instanceof StabilityAiError) {
    return error;
  }
  const failure = readHttpFailure(error);
  if (failure !== null) {
    const responseBody = decodeBody(failure.body);
    const { name, detail } = describeVendorBody(responseBody);
    const label = name ? ` (${name})` : '';
    const suffix = detail ? `: ${detail}` : '.';
    const message = `Stability AI request failed with status ${failure.status}${label}${suffix}`;
    return new StabilityAiError({
      message:
        failure.status === 403 && name === 'content_moderation'
          ? appendHint({ message, hint: 'Rephrase the prompt (English works best).' })
          : message,
      status: failure.status,
      responseBody,
    });
  }
  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
    const message = `Stability AI did not respond within ${Math.round(timeoutMs / 1000)} seconds.`;
    return new StabilityAiError({
      message: charged
        ? appendHint({ message, hint: 'The job may still have run and been charged; check your balance before running it again.' })
        : message,
      status: undefined,
      responseBody: undefined,
    });
  }
  const reason = error instanceof Error ? error.message : String(error);
  return new StabilityAiError({
    message: `Could not reach Stability AI: ${reason}`,
    status: undefined,
    responseBody: undefined,
  });
}

async function send<T>(request: HttpRequest): Promise<HttpResponse<T>> {
  const timeoutMs = request.timeout ?? JSON_TIMEOUT_MS;
  try {
    return await httpClient.sendRequest<T>({
      ...request,
      timeout: timeoutMs,
      retries: 0,
      redactBodyInErrors: true,
    });
  } catch (error) {
    throw toStabilityError({ error, timeoutMs, charged: request.method === HttpMethod.POST });
  }
}

async function sendJson<T>({ apiKey, method, path, body, timeoutMs }: SendJsonParams): Promise<T> {
  const response = await send<T>({
    method,
    url: `${API_BASE_URL}${path}`,
    headers: {
      ...authHeaders(apiKey),
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body,
    timeout: timeoutMs ?? JSON_TIMEOUT_MS,
  });
  return response.body;
}

function isStabilityFile(value: unknown): value is StabilityFile {
  return (
    isRecord(value) &&
    typeof value['filename'] === 'string' &&
    (Buffer.isBuffer(value['data']) || value['data'] instanceof Uint8Array)
  );
}

function mimeTypeForFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return INPUT_MIME_TYPES[extension] ?? 'application/octet-stream';
}

function buildFormData(fields: MultipartFields): FormData {
  const formData = new FormData();
  let totalBytes = 0;
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      formData.append(key, String(value));
      continue;
    }
    if (!isStabilityFile(value)) {
      throw new Error(`The "${key}" input must be a file.`);
    }
    totalBytes += value.data.length;
    formData.append(
      key,
      new Blob([new Uint8Array(value.data)], { type: mimeTypeForFileName(value.filename) }),
      value.filename,
    );
  }
  if (totalBytes > MAX_REQUEST_BYTES) {
    throw new Error(
      `The uploaded files total ${totalBytes} bytes; Stability AI accepts at most ${MAX_REQUEST_BYTES} bytes (10 MiB) per request.`,
    );
  }
  return formData;
}

async function sendMultipartImage({ apiKey, path, fields }: SendMultipartParams): Promise<HttpResponse<Buffer>> {
  const body = buildFormData(fields);
  return send<Buffer>({
    method: HttpMethod.POST,
    url: `${API_BASE_URL}${path}`,
    headers: { ...authHeaders(apiKey), Accept: 'image/*' },
    body,
    responseType: 'arraybuffer',
    timeout: IMAGE_TIMEOUT_MS,
  });
}

async function startAsync({ apiKey, path, fields }: SendMultipartParams): Promise<{ id: string }> {
  const body = buildFormData(fields);
  const response = await send<unknown>({
    method: HttpMethod.POST,
    url: `${API_BASE_URL}${path}`,
    headers: { ...authHeaders(apiKey), Accept: 'application/json' },
    body,
    timeout: IMAGE_TIMEOUT_MS,
  });
  const parsed = decodeBody(response.body);
  if (!isRecord(parsed) || typeof parsed['id'] !== 'string' || parsed['id'].length === 0) {
    throw new StabilityAiError({
      message: 'Stability AI accepted the request but returned no generation ID.',
      status: response.status,
      responseBody: parsed,
    });
  }
  return { id: parsed['id'] };
}

function headerValue({ headers, name }: { headers: HttpHeaders | undefined; name: string }): string | null {
  if (!headers) {
    return null;
  }
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  if (!match) {
    return null;
  }
  const value = match[1];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function extensionForMimeType(mimeType: string): string {
  const subtype = mimeType.split('/')[1]?.split(';')[0]?.trim().toLowerCase() ?? '';
  return OUTPUT_EXTENSIONS[subtype] ?? subtype;
}

function buildFileName({ outputFileName, fileNamePrefix, extension }: BuildFileNameParams): string {
  const requested = outputFileName?.trim();
  if (requested) {
    return requested.toLowerCase().endsWith(`.${extension}`) ? requested : `${requested}.${extension}`;
  }
  return `${fileNamePrefix}-${Date.now()}.${extension}`;
}

function parseSeed(value: string | null): number | null {
  if (value === null || value.trim() === '') {
    return null;
  }
  const seed = Number(value);
  return Number.isFinite(seed) ? seed : null;
}

async function writeImage({ files, response, fileNamePrefix, outputFileName }: WriteImageParams): Promise<StabilityImageOutput> {
  const contentType = headerValue({ headers: response.headers, name: 'content-type' }) ?? '';
  const mimeType = contentType.split(';')[0].trim().toLowerCase();
  const data = Buffer.isBuffer(response.body) ? response.body : Buffer.from(response.body);
  if (!mimeType.startsWith('image/')) {
    const { name, detail } = describeVendorBody(decodeBody(data));
    throw new StabilityAiError({
      message: `Stability AI returned ${mimeType || 'an unknown content type'} instead of an image${name ? ` (${name})` : ''}${detail ? `: ${detail}` : '.'}`,
      status: response.status,
      responseBody: detail,
    });
  }
  if (data.length === 0) {
    throw new StabilityAiError({
      message: 'Stability AI returned an empty image.',
      status: response.status,
      responseBody: undefined,
    });
  }
  const finishReason = headerValue({ headers: response.headers, name: 'finish-reason' });
  if (finishReason === 'ERROR') {
    throw new StabilityAiError({
      message: 'Stability AI reported finish reason ERROR for this generation.',
      status: response.status,
      responseBody: undefined,
    });
  }
  const fileName = buildFileName({ outputFileName, fileNamePrefix, extension: extensionForMimeType(mimeType) });
  const url = await saveFile({ files, fileName, data });
  return {
    fileName,
    url,
    mimeType,
    seed: parseSeed(headerValue({ headers: response.headers, name: 'seed' })),
    finishReason,
    requestId: headerValue({ headers: response.headers, name: 'x-request-id' }),
  };
}

function isFileSizeError(error: Error): boolean {
  return error.name === 'FileSizeError' || error.message.includes('larger than maximum supported size');
}

function readMaximumFileSize(error: Error): string | null {
  try {
    const parsed: unknown = JSON.parse(error.message);
    if (isRecord(parsed) && typeof parsed['maximumSupportSize'] === 'string' && parsed['maximumSupportSize'].trim() !== '') {
      return parsed['maximumSupportSize'].trim();
    }
    return null;
  } catch {
    return null;
  }
}

async function saveFile({ files, fileName, data }: SaveFileParams): Promise<string> {
  try {
    return await files.write({ fileName, data });
  } catch (error) {
    if (error instanceof Error && isFileSizeError(error)) {
      const sizeMb = Math.ceil((data.length / BYTES_PER_MB) * 100) / 100;
      const maximum = readMaximumFileSize(error);
      const limit = maximum === null ? 'the Activepieces file size limit' : `the Activepieces file size limit (${maximum})`;
      throw new StabilityResultTooLargeError({
        message: `Stability AI generated the image and charged the credits, but the ${sizeMb} MB file is larger than ${limit}. Run the step again with Output Format set to WebP or JPEG.`,
      });
    }
    throw error;
  }
}

async function generateImageFile({ apiKey, path, fields, files, fileNamePrefix, outputFileName }: GenerateImageFileParams): Promise<StabilityImageOutput> {
  const response = await sendMultipartImage({ apiKey, path, fields });
  return writeImage({ files, response, fileNamePrefix, outputFileName });
}

function normalizeGenerationId(value: unknown): string {
  const id = typeof value === 'string' ? value.trim() : '';
  if (!GENERATION_ID_PATTERN.test(id)) {
    throw new Error('Generation ID must be the 64-character ID returned when the generation was started.');
  }
  return id;
}

async function getResult({ apiKey, id, files, fileNamePrefix, outputFileName, timeoutMs }: GetResultParams): Promise<StabilityAsyncOutput> {
  const generationId = normalizeGenerationId(id);
  const response = await fetchResult({ apiKey, generationId, timeoutMs });
  if (response.status === 202) {
    return inProgressOutput(generationId);
  }
  const image = await writeImage({ files, response, fileNamePrefix, outputFileName });
  return { status: 'complete', generationId, ...image };
}

async function fetchResult({ apiKey, generationId, timeoutMs }: FetchResultParams): Promise<HttpResponse<Buffer>> {
  try {
    return await send<Buffer>({
      method: HttpMethod.GET,
      url: `${API_BASE_URL}/v2beta/results/${encodeURIComponent(generationId)}`,
      headers: { ...authHeaders(apiKey), Accept: '*/*' },
      responseType: 'arraybuffer',
      timeout: timeoutMs ?? IMAGE_TIMEOUT_MS,
    });
  } catch (error) {
    if (error instanceof StabilityAiError && error.status === 404) {
      throw new StabilityAiError({
        message: appendHint({
          message: error.message,
          hint: 'Results are kept for 24 hours after the job starts and can only be fetched with the same API key that started it.',
        }),
        status: error.status,
        responseBody: error.responseBody,
      });
    }
    throw error;
  }
}

function inProgressOutput(generationId: string): StabilityAsyncOutput {
  return {
    status: 'in-progress',
    generationId,
    fileName: null,
    url: null,
    mimeType: null,
    seed: null,
    finishReason: null,
    requestId: null,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollOnce({ apiKey, id, files, fileNamePrefix, outputFileName }: GetResultParams): Promise<StabilityAsyncOutput> {
  try {
    return await getResult({ apiKey, id, files, fileNamePrefix, outputFileName, timeoutMs: POLL_TIMEOUT_MS });
  } catch (error) {
    if (error instanceof StabilityResultTooLargeError) {
      throw error;
    }
    const base = toStabilityError({ error, timeoutMs: POLL_TIMEOUT_MS, charged: false });
    throw new StabilityAiError({
      message: appendHint({
        message: base.message,
        hint: `The job was started and charged; its generation ID is ${id}. Use Get Generation Result to fetch it within 24 hours.`,
      }),
      status: base.status,
      responseBody: base.responseBody,
    });
  }
}

async function waitForResult({ apiKey, id, files, fileNamePrefix, outputFileName, deadline }: WaitForResultParams): Promise<StabilityAsyncOutput> {
  let latest = inProgressOutput(id);
  while (Date.now() + POLL_INTERVAL_MS + POLL_TIMEOUT_MS <= deadline) {
    await sleep(POLL_INTERVAL_MS);
    latest = await pollOnce({ apiKey, id, files, fileNamePrefix, outputFileName });
    if (latest.status === 'complete') {
      return latest;
    }
  }
  return latest;
}

async function startAndMaybeWait({ apiKey, path, fields, files, fileNamePrefix, outputFileName, waitForCompletion }: StartAndMaybeWaitParams): Promise<StabilityAsyncOutput> {
  const deadline = Date.now() + WAIT_BUDGET_MS;
  const { id } = await startAsync({ apiKey, path, fields });
  if (!waitForCompletion) {
    return inProgressOutput(id);
  }
  return waitForResult({ apiKey, id, files, fileNamePrefix, outputFileName, deadline });
}

const API_BASE_URL = 'https://api.stability.ai';
const CLIENT_ID = 'activepieces';
const JSON_TIMEOUT_MS = 60_000;
const IMAGE_TIMEOUT_MS = 150_000;
const POLL_INTERVAL_MS = 10_000;
const WAIT_BUDGET_MS = 240_000;
const POLL_TIMEOUT_MS = 30_000;
const MAX_REQUEST_BYTES = 10 * 1024 * 1024;
const MAX_RAW_ERROR_LENGTH = 500;
const BYTES_PER_MB = 1024 * 1024;
const GENERATION_ID_PATTERN = /^[A-Za-z0-9]{64}$/;
const INPUT_MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};
const OUTPUT_EXTENSIONS: Record<string, string> = {
  png: 'png',
  jpeg: 'jpeg',
  jpg: 'jpeg',
  webp: 'webp',
};

type StabilityAiErrorParams = {
  message: string;
  status: number | undefined;
  responseBody: unknown;
};

type SendJsonParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  timeoutMs?: number;
};

type SendMultipartParams = {
  apiKey: string;
  path: string;
  fields: MultipartFields;
};

type BuildFileNameParams = {
  outputFileName: string | undefined;
  fileNamePrefix: string;
  extension: string;
};

type WriteImageParams = {
  files: FilesService;
  response: HttpResponse<Buffer>;
  fileNamePrefix: string;
  outputFileName: string | undefined;
};

type SaveFileParams = {
  files: FilesService;
  fileName: string;
  data: Buffer;
};

type FetchResultParams = {
  apiKey: string;
  generationId: string;
  timeoutMs: number | undefined;
};

type GenerateImageFileParams = SendMultipartParams & {
  files: FilesService;
  fileNamePrefix: string;
  outputFileName: string | undefined;
};

type GetResultParams = {
  apiKey: string;
  id: string;
  files: FilesService;
  fileNamePrefix: string;
  outputFileName: string | undefined;
  timeoutMs?: number;
};

type WaitForResultParams = GetResultParams & {
  deadline: number;
};

type StartAndMaybeWaitParams = GenerateImageFileParams & {
  waitForCompletion: boolean;
};

export type StabilityFile = {
  filename: string;
  data: Buffer;
};

export type MultipartFields = Record<string, string | number | StabilityFile | undefined | null>;

export type StabilityImageOutput = {
  fileName: string;
  url: string;
  mimeType: string;
  seed: number | null;
  finishReason: string | null;
  requestId: string | null;
};

export type StabilityAsyncOutput =
  | ({ status: 'complete'; generationId: string } & StabilityImageOutput)
  | {
      status: 'in-progress';
      generationId: string;
      fileName: null;
      url: null;
      mimeType: null;
      seed: null;
      finishReason: null;
      requestId: null;
    };

export { StabilityAiError };

export const stabilityClient = {
  sendJson,
  appendHint,
  generateImageFile,
  startAndMaybeWait,
  getResult,
  normalizeGenerationId,
  pollIntervalMs: POLL_INTERVAL_MS,
  waitBudgetMs: WAIT_BUDGET_MS,
};
