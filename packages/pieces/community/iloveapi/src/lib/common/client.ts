import { Readable } from 'stream';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import type FormData from 'form-data';
import { iloveHost } from './host';
import { SignatureDraft, buildSignatureRequest } from './signature';
import {
  AuthResponse,
  CreateSignatureRequest,
  CreateSignatureResponse,
  ILoveApiRegion,
  ILoveApiTool,
  ProcessFile,
  ProcessRequest,
  ProcessResponse,
  StartTaskResponse,
  UploadResponse,
} from './types';

const PDF_API = 'https://api.ilovepdf.com';
const IMG_API = 'https://api.iloveimg.com';
const REQUEST_TIMEOUT_MS = 60_000;
const UPLOAD_TIMEOUT_MS = 120_000;
const PROCESS_TIMEOUT_MS = 240_000;
const DOWNLOAD_TIMEOUT_MS = 120_000;
const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;
const MAX_ATTEMPTS = 4;
const TASK_BUDGET_MS = 520_000;
const TASK_TIMEOUT_MESSAGE = 'iLoveAPI did not finish within the step time limit. Try a smaller file or fewer files.';
const MAX_SIGNATURE_FILES = 5;
const BASE_BACKOFF_MS = 2_000;
const MAX_BACKOFF_MS = 20_000;

let verifiedTlsAgent: Promise<unknown> | undefined;

export class ILoveApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown
  ) {
    super(message);
    this.name = 'ILoveApiError';
  }
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(
    ({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } })
  );
  return verifiedTlsAgent;
}

function isFormData(value: RequestBody | undefined): value is FormData {
  return value !== undefined && typeof Reflect.get(value, 'getHeaders') === 'function';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function failureOf(error: unknown): { status: number; body: unknown } | null {
  if (error === null || typeof error !== 'object') return null;
  const response = Reflect.get(error, 'response');
  if (!isRecord(response)) return null;
  const status = response['status'];
  return typeof status === 'number' ? { status, body: response['body'] } : null;
}

function vendorMessage(body: unknown): string {
  if (isRecord(body)) {
    const nested = body['error'];
    if (isRecord(nested)) {
      const parts = [nested['type'], nested['message']]
        .filter((part) => typeof part === 'string' && part.trim() !== '')
        .map(String);
      const param = nested['param'];
      if (isRecord(param) || Array.isArray(param)) {
        parts.push(JSON.stringify(param).slice(0, 300));
      }
      if (parts.length > 0) return parts.join(': ');
    }
    const parts = [body['name'], body['message']]
      .filter((part) => typeof part === 'string' && part.trim() !== '')
      .map(String);
    if (parts.length > 0) return parts.join(': ');
  }
  if (typeof body === 'string' && body.trim()) return body.trim().slice(0, 300);
  return 'request failed';
}

function hintFor({ status, message }: { status: number; message: string }): string {
  if (/WrongPassword/i.test(message)) {
    return ' The PDF password is wrong. Check the password and try again.';
  }
  if (status === 401) return ' Check the project public key or reconnect your iLoveAPI account.';
  if (status === 403) return ' This project has no access to this resource.';
  if (status === 404) return ' The task, file or signature was not found. Tasks are deleted 2 hours after processing.';
  if (status === 429) return ' iLoveAPI rate limit reached; try again later.';
  return '';
}

function toApiError({ status, body }: { status: number; body: unknown }): ILoveApiError {
  const message = vendorMessage(body).replace(/\.$/, '');
  return new ILoveApiError(
    `iLoveAPI error (${status}): ${message}.${hintFor({ status, message })}`,
    status,
    body
  );
}

function backoffFor(attempt: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
}

type RequestBody = Record<string, unknown> | FormData;

async function request<T>({
  method,
  url,
  token,
  body,
  query,
  timeout,
  deadline,
}: {
  method: HttpMethod;
  url: string;
  token?: string;
  body?: () => RequestBody;
  query?: Record<string, string>;
  timeout?: number;
  deadline?: number;
}): Promise<T> {
  if (!iloveHost.isAllowedUrl(url)) {
    throw new Error('Refusing to send iLoveAPI credentials to a URL outside the iLoveAPI hosts.');
  }
  const dispatcher = await verifiedTls();
  for (let attempt = 0; ; attempt++) {
    const requestTimeout = boundedTimeout({ timeout: timeout ?? REQUEST_TIMEOUT_MS, deadline });
    const payload = body?.();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (isFormData(payload)) {
      Object.assign(headers, payload.getHeaders());
    } else if (payload !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    try {
      const response = await httpClient.sendRequest<T>(
        {
          method,
          url,
          headers,
          queryParams: query,
          body: payload,
          timeout: requestTimeout,
          followRedirects: false,
          redactBodyInErrors: true,
        },
        { dispatcher }
      );
      if (response.status >= 300) {
        throw new ILoveApiError(
          `iLoveAPI error (${response.status}): unexpected redirect.`,
          response.status,
          undefined
        );
      }
      return response.body;
    } catch (error) {
      const failure = failureOf(error);
      if (failure?.status === 429 && attempt + 1 < MAX_ATTEMPTS) {
        const wait = backoffFor(attempt);
        if (deadline !== undefined && Date.now() + wait >= deadline) {
          throw new Error(TASK_TIMEOUT_MESSAGE);
        }
        await sleep(wait);
        continue;
      }
      if (failure) throw toApiError(failure);
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        if (deadline !== undefined && Date.now() >= deadline) {
          throw new Error(TASK_TIMEOUT_MESSAGE);
        }
        throw new Error(
          `iLoveAPI did not answer within ${Math.round((timeout ?? REQUEST_TIMEOUT_MS) / 1000)} seconds.`
        );
      }
      throw error;
    }
  }
}

function boundedTimeout({ timeout, deadline }: { timeout: number; deadline: number | undefined }): number {
  if (deadline === undefined) return timeout;
  const remaining = deadline - Date.now();
  if (remaining <= 0) {
    throw new Error(TASK_TIMEOUT_MESSAGE);
  }
  return Math.min(timeout, remaining);
}

async function authenticate({ publicKey, deadline }: { publicKey: string; deadline?: number }): Promise<string> {
  const key = typeof publicKey === 'string' ? publicKey.trim() : '';
  if (!key) {
    throw new Error('The iLoveAPI connection has no project public key. Reconnect your account.');
  }
  const response = await request<AuthResponse>({
    method: HttpMethod.POST,
    url: `${PDF_API}/v1/auth`,
    body: () => ({ public_key: key }),
    deadline,
  });
  if (!isRecord(response) || typeof response.token !== 'string' || response.token === '') {
    throw new Error('iLoveAPI did not return an access token.');
  }
  return response.token;
}

function isImageTool(tool: ILoveApiTool): boolean {
  return tool.endsWith('image');
}

async function startTask({
  token,
  tool,
  region,
  deadline,
}: {
  token: string;
  tool: ILoveApiTool;
  region?: ILoveApiRegion;
  deadline?: number;
}): Promise<StartTaskResponse> {
  const base = isImageTool(tool) ? IMG_API : PDF_API;
  const url = region ? `${base}/v1/start/${tool}/${region}` : `${base}/v1/start/${tool}`;
  const response = await request<StartTaskResponse>({ method: HttpMethod.GET, url, token, deadline });
  if (!isRecord(response) || typeof response.task !== 'string' || response.task === '') {
    throw new Error('iLoveAPI did not return a task ID when starting the task.');
  }
  return { ...response, server: iloveHost.assertServerHost(response.server) };
}

async function uploadBuffer({
  token,
  server,
  task,
  buffer,
  filename,
  deadline,
}: {
  token: string;
  server: string;
  task: string;
  buffer: Buffer;
  filename: string;
  deadline?: number;
}): Promise<string> {
  const host = iloveHost.assertServerHost(server);
  const { default: FormDataCtor } = await import('form-data');
  const response = await request<UploadResponse>({
    method: HttpMethod.POST,
    url: `https://${host}/v1/upload`,
    token,
    timeout: UPLOAD_TIMEOUT_MS,
    deadline,
    body: () => {
      const form = new FormDataCtor();
      form.append('task', task);
      form.append('file', buffer, filename);
      return form;
    },
  });
  return serverFilenameOf(response);
}

async function uploadCloudUrl({
  token,
  server,
  task,
  url,
  deadline,
}: {
  token: string;
  server: string;
  task: string;
  url: string;
  deadline?: number;
}): Promise<string> {
  const host = iloveHost.assertServerHost(server);
  const response = await request<UploadResponse>({
    method: HttpMethod.POST,
    url: `https://${host}/v1/upload`,
    token,
    timeout: UPLOAD_TIMEOUT_MS,
    deadline,
    body: () => ({ task, cloud_file: url }),
  });
  return serverFilenameOf(response);
}

function serverFilenameOf(response: UploadResponse): string {
  if (!isRecord(response) || typeof response.server_filename !== 'string' || response.server_filename === '') {
    throw new Error('iLoveAPI accepted the upload but returned no server file name.');
  }
  return response.server_filename;
}

async function processTask({
  token,
  server,
  body,
  deadline,
}: {
  token: string;
  server: string;
  body: ProcessRequest;
  deadline?: number;
}): Promise<ProcessResponse> {
  const host = iloveHost.assertServerHost(server);
  return request<ProcessResponse>({
    method: HttpMethod.POST,
    url: `https://${host}/v1/process`,
    token,
    timeout: PROCESS_TIMEOUT_MS,
    deadline,
    body: () => body,
  });
}

async function download({
  token,
  url,
  deadline: taskDeadline,
}: {
  token: string;
  url: string;
  deadline?: number;
}): Promise<{ data: Buffer; contentType: string | undefined }> {
  if (!iloveHost.isAllowedUrl(url)) {
    throw new Error('Refusing to send iLoveAPI credentials to a URL outside the iLoveAPI hosts.');
  }
  const dispatcher = await verifiedTls();
  const downloadTimeout = boundedTimeout({ timeout: DOWNLOAD_TIMEOUT_MS, deadline: taskDeadline });
  const deadline = Date.now() + downloadTimeout;
  let response;
  try {
    response = await httpClient.sendRequest<unknown>(
      {
        method: HttpMethod.GET,
        url,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf, application/zip, image/*, text/plain, */*',
        },
        responseType: 'stream',
        timeout: downloadTimeout,
        followRedirects: false,
      },
      { dispatcher }
    );
  } catch (error) {
    const failure = failureOf(error);
    if (failure) throw toApiError(failure);
    throw error;
  }
  if (response.status >= 300) {
    throw new ILoveApiError(
      `iLoveAPI download failed with status ${response.status}.`,
      response.status,
      undefined
    );
  }
  const data = await readCapped({ body: response.body, deadline });
  const header = response.headers?.['content-type'];
  return { data, contentType: Array.isArray(header) ? header[0] : header };
}

async function readCapped({ body, deadline }: { body: unknown; deadline: number }): Promise<Buffer> {
  if (!(body instanceof Readable)) {
    throw new Error('iLoveAPI returned an empty file.');
  }
  const remaining = Math.max(deadline - Date.now(), 1);
  const timer = setTimeout(
    () =>
      body.destroy(
        new Error(`The download did not finish within ${DOWNLOAD_TIMEOUT_MS / 1000} seconds.`)
      ),
    remaining
  );
  try {
    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of body) {
      const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += part.length;
      if (total > MAX_DOWNLOAD_BYTES) {
        body.destroy();
        throw new Error('The result is larger than 100 MB and cannot be stored in a flow step.');
      }
      chunks.push(part);
    }
    return Buffer.concat(chunks);
  } finally {
    clearTimeout(timer);
  }
}

async function downloadResult({
  token,
  server,
  task,
  deadline,
}: {
  token: string;
  server: string;
  task: string;
  deadline?: number;
}): Promise<Buffer> {
  const host = iloveHost.assertServerHost(server);
  const { data } = await download({
    token,
    url: `https://${host}/v1/download/${encodeURIComponent(task)}`,
    deadline,
  });
  return data;
}

function tokenSegment({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text === '' || text === '.' || text === '..') {
    throw new Error(`${label} is required.`);
  }
  return encodeURIComponent(text);
}

async function createSignature({
  token,
  server,
  body,
}: {
  token: string;
  server: string;
  body: CreateSignatureRequest;
}): Promise<CreateSignatureResponse> {
  const host = iloveHost.assertServerHost(server);
  return request<CreateSignatureResponse>({
    method: HttpMethod.POST,
    url: `https://${host}/v1/signature`,
    token,
    timeout: PROCESS_TIMEOUT_MS,
    body: () => body,
  });
}

async function signatureCall({
  token,
  method,
  path,
  body,
  query,
}: {
  token: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string>;
}): Promise<Record<string, unknown>> {
  const response = await request<unknown>({
    method,
    url: `${PDF_API}/v1/signature/${path}`,
    token,
    query,
    body: body ? () => body : undefined,
  });
  return isRecord(response) ? response : { result: response };
}

async function getSignatureStatus({ token, tokenRequester }: { token: string; tokenRequester: string }) {
  return signatureCall({
    token,
    method: HttpMethod.GET,
    path: `requesterview/${tokenSegment({ value: tokenRequester, label: 'Requester Token' })}`,
  });
}

async function getSignerInfo({ token, tokenSigner }: { token: string; tokenSigner: string }) {
  return signatureCall({
    token,
    method: HttpMethod.GET,
    path: `receiver/info/${tokenSegment({ value: tokenSigner, label: 'Signer Token' })}`,
  });
}

async function listSignatures({
  token,
  page,
  perPage,
}: {
  token: string;
  page: number;
  perPage: number;
}): Promise<unknown> {
  return request<unknown>({
    method: HttpMethod.GET,
    url: `${PDF_API}/v1/signature/list`,
    token,
    query: { page: String(page), 'per-page': String(perPage) },
  });
}

async function sendSignerReminder({ token, tokenRequester }: { token: string; tokenRequester: string }) {
  return signatureCall({
    token,
    method: HttpMethod.POST,
    path: `sendReminder/${tokenSegment({ value: tokenRequester, label: 'Requester Token' })}`,
  });
}

async function voidSignature({ token, tokenRequester }: { token: string; tokenRequester: string }) {
  return signatureCall({
    token,
    method: HttpMethod.POST,
    path: `void/${tokenSegment({ value: tokenRequester, label: 'Requester Token' })}`,
  });
}

async function increaseExpirationDays({
  token,
  tokenRequester,
  days,
}: {
  token: string;
  tokenRequester: string;
  days: number;
}) {
  return signatureCall({
    token,
    method: HttpMethod.POST,
    path: `increase-expiration-days/${tokenSegment({ value: tokenRequester, label: 'Requester Token' })}`,
    body: { days },
  });
}

async function resolveSignatureServer({
  token,
  tokenRequester,
  server,
}: {
  token: string;
  tokenRequester: string;
  server?: string;
}): Promise<string> {
  if (server && server.trim() !== '') {
    return iloveHost.assertServerHost(server);
  }
  const view = await getSignatureStatus({ token, tokenRequester });
  const fromView = view['server'];
  if (typeof fromView === 'string' && fromView.trim() !== '') {
    return iloveHost.assertServerHost(fromView);
  }
  return new URL(PDF_API).hostname;
}

async function downloadSignatureFile({
  token,
  tokenRequester,
  server,
  kind,
}: {
  token: string;
  tokenRequester: string;
  server?: string;
  kind: 'signed' | 'audit' | 'original';
}): Promise<{ data: Buffer; contentType: string | undefined; server: string }> {
  const host = await resolveSignatureServer({ token, tokenRequester, server });
  const segment = tokenSegment({ value: tokenRequester, label: 'Requester Token' });
  const result = await download({
    token,
    url: `https://${host}/v1/signature/${segment}/download-${kind}`,
  });
  return { ...result, server: host };
}

async function uploadOne({
  token,
  server,
  task,
  upload,
  deadline,
}: {
  token: string;
  server: string;
  task: string;
  upload: UploadInput;
  deadline?: number;
}): Promise<{ serverFilename: string; filename: string }> {
  if (upload.kind === 'file') {
    const serverFilename = await uploadBuffer({
      token,
      server,
      task,
      buffer: upload.file.data,
      filename: upload.file.filename,
      deadline,
    });
    return { serverFilename, filename: upload.file.filename };
  }
  const serverFilename = await uploadCloudUrl({ token, server, task, url: upload.url, deadline });
  return { serverFilename, filename: upload.filename ?? deriveFilenameFromUrl(upload.url) };
}

async function runTask({
  publicKey,
  tool,
  region,
  uploads,
  options,
  output_filename,
  packaged_filename,
  perFileOverrides,
  extraUploads,
  skipDownload,
  webhook,
}: RunTaskInput): Promise<RunTaskResult> {
  const deadline = Date.now() + TASK_BUDGET_MS;
  let timer: NodeJS.Timeout | undefined;
  const budget = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(TASK_TIMEOUT_MESSAGE)),
      TASK_BUDGET_MS
    );
  });
  try {
    return await Promise.race([
      runTaskSteps({ publicKey, tool, region, uploads, options, output_filename, packaged_filename, perFileOverrides, extraUploads, skipDownload, webhook, deadline }),
      budget,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function assertWithinBudget(deadline: number): void {
  if (Date.now() >= deadline) {
    throw new Error(TASK_TIMEOUT_MESSAGE);
  }
}

async function runTaskSteps({
  publicKey,
  tool,
  region,
  uploads,
  options,
  output_filename,
  packaged_filename,
  perFileOverrides,
  extraUploads,
  skipDownload,
  webhook,
  deadline,
}: RunTaskInput & { deadline: number }): Promise<RunTaskResult> {
  if (!uploads || uploads.length === 0) {
    throw new Error('At least one input file or URL is required');
  }

  const token = await authenticate({ publicKey, deadline });
  const started = await startTask({ token, tool, region, deadline });
  const { server, task } = started;

  const files: ProcessFile[] = [];
  for (let i = 0; i < uploads.length; i++) {
    assertWithinBudget(deadline);
    const uploaded = await uploadOne({ token, server, task, upload: uploads[i], deadline });
    files.push({
      server_filename: uploaded.serverFilename,
      filename: uploaded.filename,
      ...perFileOverrides?.[i],
    });
  }

  const uploadedExtraFilenames: string[] = [];
  for (const extra of extraUploads ?? []) {
    assertWithinBudget(deadline);
    const uploaded = await uploadOne({ token, server, task, upload: extra, deadline });
    uploadedExtraFilenames.push(uploaded.serverFilename);
  }

  const resolvedOptions =
    typeof options === 'function' ? options(uploadedExtraFilenames) : options ?? {};

  const processBody: ProcessRequest = {
    ...resolvedOptions,
    task,
    tool,
    files,
    ...(output_filename ? { output_filename } : {}),
    ...(packaged_filename ? { packaged_filename } : {}),
    ...(webhook ? { webhook } : {}),
  };

  assertWithinBudget(deadline);
  const processResponse = await processTask({ token, server, body: processBody, deadline });
  if (!isRecord(processResponse)) {
    throw new Error('iLoveAPI returned an empty process response.');
  }

  assertWithinBudget(deadline);
  const buffer = skipDownload ? undefined : await downloadResult({ token, server, task, deadline });

  return {
    buffer,
    downloadFilename: processResponse.download_filename,
    process: processResponse,
    task,
    server,
    remainingCredits: remainingCreditsOf(started),
    uploadedExtraFilenames,
  };
}

async function createSignatureRequest({
  publicKey,
  region,
  uploads,
  draft,
}: {
  publicKey: string;
  region?: ILoveApiRegion;
  uploads: UploadInput[];
  draft: SignatureDraft;
}): Promise<CreateSignatureResponse & { server: string }> {
  if (uploads.length === 0) {
    throw new Error('At least one PDF file is required.');
  }
  if (uploads.length > MAX_SIGNATURE_FILES) {
    throw new Error(`iLoveSign accepts at most ${MAX_SIGNATURE_FILES} files per signature request.`);
  }
  const token = await authenticate({ publicKey });
  const { server, task } = await startTask({ token, tool: 'sign', region });
  const files: Array<{ server_filename: string; filename: string }> = [];
  for (const upload of uploads) {
    const uploaded = await uploadOne({ token, server, task, upload });
    files.push({ server_filename: uploaded.serverFilename, filename: uploaded.filename });
  }
  const response = await createSignature({
    token,
    server,
    body: buildSignatureRequest({ draft, task, files }),
  });
  return { ...response, server };
}

function remainingCreditsOf(started: StartTaskResponse): number | undefined {
  const value = started.remaining_credits ?? started.remaining_files;
  return typeof value === 'number' ? value : undefined;
}

function deriveFilenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split('/').filter(Boolean).pop();
    if (last && last.length > 0) return decodeURIComponent(last);
  } catch {
    return 'remote-file';
  }
  return 'remote-file';
}

export const iLoveApi = {
  PDF_API,
  isRecord,
  authenticate,
  startTask,
  uploadBuffer,
  uploadCloudUrl,
  processTask,
  downloadResult,
  createSignature,
  createSignatureRequest,
  getSignatureStatus,
  getSignerInfo,
  listSignatures,
  sendSignerReminder,
  voidSignature,
  increaseExpirationDays,
  downloadSignatureFile,
  runTask,
  failureOf,
};

export type UploadInput =
  | { kind: 'file'; file: { data: Buffer; filename: string } }
  | { kind: 'url'; url: string; filename?: string };

export type RunTaskInput = {
  publicKey: string;
  tool: ILoveApiTool;
  region?: ILoveApiRegion;
  uploads: UploadInput[];
  options?:
    | Record<string, unknown>
    | ((extraServerFilenames: string[]) => Record<string, unknown>);
  output_filename?: string;
  packaged_filename?: string;
  perFileOverrides?: Array<Partial<Pick<ProcessFile, 'rotate' | 'password'>>>;
  extraUploads?: UploadInput[];
  skipDownload?: boolean;
  webhook?: string;
};

export type RunTaskResult = {
  buffer: Buffer | undefined;
  downloadFilename: string;
  process: ProcessResponse;
  task: string;
  server: string;
  remainingCredits: number | undefined;
  uploadedExtraFilenames: string[];
};
