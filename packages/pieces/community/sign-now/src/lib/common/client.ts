import { Readable } from 'node:stream';
import { HttpError, HttpHeaders, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
let verifiedTlsAgent: Promise<unknown> | undefined;

function verifiedTlsDispatcher(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(
    ({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } })
  );
  return verifiedTlsAgent;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function textAt({ value, key }: { value: unknown; key: string }): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const field = value[key];
  if (typeof field === 'string') {
    return field;
  }
  if (typeof field === 'number' && Number.isFinite(field)) {
    return String(field);
  }
  return undefined;
}

function numberAt({ value, key }: { value: unknown; key: string }): number | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const field = value[key];
  if (typeof field === 'number' && Number.isFinite(field)) {
    return field;
  }
  if (typeof field === 'string' && field.trim() !== '' && Number.isFinite(Number(field))) {
    return Number(field);
  }
  return undefined;
}

function recordsAt({ value, key }: { value: unknown; key: string }): Record<string, unknown>[] {
  if (!isRecord(value)) {
    return [];
  }
  const field = value[key];
  return Array.isArray(field) ? field.filter(isRecord) : [];
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item !== '');
}

function segment(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') {
    throw new Error('An ID is empty. Map or enter a SignNow ID.');
  }
  return encodeURIComponent(trimmed);
}

function vendorMessage(responseBody: unknown): string {
  if (typeof responseBody === 'string') {
    const text = responseBody.trim();
    return text === '' ? 'no details returned' : text.slice(0, MAX_ERROR_TEXT);
  }
  const errors = recordsAt({ value: responseBody, key: 'errors' });
  const parts = errors
    .map((error) =>
      [textAt({ value: error, key: 'message' }), textAt({ value: error, key: 'code' })]
        .filter((part): part is string => part !== undefined && part !== '')
        .join(' - ')
    )
    .filter((text) => text !== '');
  if (parts.length > 0) {
    return parts.join('; ').slice(0, MAX_ERROR_TEXT);
  }
  const single = [
    textAt({ value: responseBody, key: 'error' }),
    textAt({ value: responseBody, key: 'message' }),
    textAt({ value: responseBody, key: 'code' }),
  ].filter((part): part is string => part !== undefined && part !== '');
  if (single.length > 0) {
    return single.join(' - ').slice(0, MAX_ERROR_TEXT);
  }
  const anyText = isRecord(responseBody)
    ? Object.values(responseBody).find((value): value is string => typeof value === 'string' && value.trim() !== '')
    : undefined;
  return anyText === undefined ? 'no details returned' : anyText.trim().slice(0, MAX_ERROR_TEXT);
}

function transportReason(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'the network request failed';
  }
  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return 'the request timed out';
  }
  const code = textAt({ value: error.cause, key: 'code' });
  return code !== undefined ? `network error ${code}` : 'the network request failed';
}

function buildUrl({ path, query }: { path: string; query?: SignNowQuery }): string {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('?') || path.split('/').includes('..')) {
    throw new Error('Refusing to send a SignNow request to an unexpected path.');
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  }
  const text = params.toString();
  return `${SIGN_NOW_API_URL}${path}${text === '' ? '' : `?${text}`}`;
}

function parseBody(text: string): unknown {
  if (text.trim() === '') {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function send({ token, method, path, operation, query, body, form, accept, timeoutMs, responseType }: SendParams & { responseType: 'text' | 'stream' }): Promise<RawResponse> {
  const key = token.trim();
  if (key === '') {
    throw new Error('The SignNow credentials are empty. Reconnect the SignNow connection.');
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    Accept: accept ?? 'application/json',
  };
  const httpRequest: HttpRequest = {
    method: HTTP_METHODS[method],
    url: buildUrl({ path, query }),
    headers,
    timeout: timeoutMs ?? REQUEST_TIMEOUT_MS,
    followRedirects: false,
    responseType,
    redactBodyInErrors: true,
  };
  if (form !== undefined) {
    httpRequest.body = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    httpRequest.body = JSON.stringify(body);
  }
  const dispatcher = await verifiedTlsDispatcher();
  try {
    const response = await httpClient.sendRequest<unknown>(httpRequest, { dispatcher });
    if (response.status >= 300) {
      throw new SignNowApiError({ operation, status: response.status, responseBody: 'unexpected redirect, not followed' });
    }
    return { status: response.status, headers: response.headers ?? {}, body: response.body };
  } catch (error) {
    if (error instanceof SignNowApiError) {
      throw error;
    }
    if (error instanceof HttpError) {
      const responseBody = error.response.body;
      throw new SignNowApiError({
        operation,
        status: error.response.status,
        responseBody: typeof responseBody === 'string' ? parseBody(responseBody) : responseBody,
      });
    }
    const mayHaveApplied = method !== 'GET';
    throw new Error(
      `SignNow ${operation} failed: ${transportReason(error)}.${mayHaveApplied ? ' The request may still have been applied; check SignNow before retrying.' : ''}`
    );
  }
}

async function request(params: SendParams): Promise<unknown> {
  const response = await send({ ...params, responseType: 'text' });
  return typeof response.body === 'string' ? parseBody(response.body) : response.body ?? {};
}

async function download(params: SendParams): Promise<{ data: Buffer; contentType: string | undefined; fileName: string | undefined }> {
  const deadline = Date.now() + (params.timeoutMs ?? REQUEST_TIMEOUT_MS);
  const response = await send({ ...params, responseType: 'stream' });
  const length = Number(headerOf({ headers: response.headers, name: 'content-length' }) ?? '0');
  if (length > MAX_DOWNLOAD_BYTES) {
    if (response.body instanceof Readable) {
      response.body.destroy();
    }
    throw new Error(`SignNow ${params.operation} failed: the file is larger than 50 MB.`);
  }
  const data = await readCapped({ body: response.body, operation: params.operation, deadline });
  return {
    data,
    contentType: headerOf({ headers: response.headers, name: 'content-type' }),
    fileName: fileNameFrom(headerOf({ headers: response.headers, name: 'content-disposition' }) ?? null),
  };
}

function headerOf({ headers, name }: { headers: HttpHeaders; name: string }): string | undefined {
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  if (match === undefined) {
    return undefined;
  }
  const value = match[1];
  return Array.isArray(value) ? value[0] : value;
}

async function readCapped({ body, operation, deadline }: { body: unknown; operation: string; deadline: number }): Promise<Buffer> {
  if (!(body instanceof Readable)) {
    return Buffer.isBuffer(body) ? body : Buffer.alloc(0);
  }
  const chunks: Buffer[] = [];
  let total = 0;
  const timer = setTimeout(() => body.destroy(new Error('deadline')), Math.max(deadline - Date.now(), 0));
  try {
    for await (const chunk of body) {
      const piece = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += piece.length;
      if (total > MAX_DOWNLOAD_BYTES) {
        body.destroy();
        throw new Error(`SignNow ${operation} failed: the file is larger than 50 MB.`);
      }
      chunks.push(piece);
    }
    return Buffer.concat(chunks, total);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('SignNow ')) {
      throw error;
    }
    throw new Error(`SignNow ${operation} failed: ${error instanceof Error && error.message === 'deadline' ? 'the download timed out' : transportReason(error)}.`);
  } finally {
    clearTimeout(timer);
  }
}

function fileNameFrom(disposition: string | null): string | undefined {
  if (disposition === null || disposition === '') {
    return undefined;
  }
  const extended = /filename\*\s*=\s*(?:[\w-]+'[^']*')?"?([^";]+)"?/i.exec(disposition);
  if (extended !== null) {
    return safeDecode(extended[1].trim());
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(disposition);
  return plain !== null ? plain[1].trim() : undefined;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function getUser({ token, timeoutMs }: { token: string; timeoutMs?: number }): Promise<Record<string, unknown>> {
  const body = await request({ token, method: 'GET', path: '/user', operation: 'get user', timeoutMs });
  return isRecord(body) ? body : {};
}

async function getUserId({ token }: { token: string }): Promise<string> {
  const id = textAt({ value: await getUser({ token }), key: 'id' });
  if (id === undefined || id === '') {
    throw new Error('SignNow did not return a user ID for this connection.');
  }
  return id;
}

async function uploadDocument({ token, file, checkFields }: { token: string; file: unknown; checkFields: boolean }): Promise<{ id: string }> {
  const base64 = textAt({ value: file, key: 'base64' });
  if (base64 === undefined || base64 === '') {
    throw new Error('Select a file to upload to SignNow.');
  }
  const data = Buffer.from(base64, 'base64');
  if (data.length > MAX_DOWNLOAD_BYTES) {
    throw new Error('The file is larger than the 50 MB SignNow upload limit.');
  }
  const fileName = textAt({ value: file, key: 'filename' }) || 'document.pdf';
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(data)]), fileName);
  if (checkFields) {
    form.append('check_fields', 'true');
  }
  const body = await request({ token, method: 'POST', path: '/document', operation: 'upload document', form, timeoutMs: UPLOAD_TIMEOUT_MS });
  const id = textAt({ value: body, key: 'id' });
  if (id === undefined || id === '') {
    throw new Error('SignNow did not return a document ID for the upload.');
  }
  return { id };
}

function isNotFound(error: unknown): boolean {
  return error instanceof SignNowApiError && error.status === 404;
}

function optionalText({ value, key }: { value: unknown; key: string }): string | undefined {
  const text = textAt({ value, key });
  return text === undefined || text.trim() === '' ? undefined : text;
}

function roleSigners({ signers, withExpiration }: { signers: unknown; withExpiration: boolean }): Record<string, unknown>[] {
  const entries = Array.isArray(signers) ? signers.filter(isRecord) : [];
  if (entries.length === 0) {
    throw new Error('Add at least one signer with an email and a role name.');
  }
  return entries.map((signer, index) => {
    const email = optionalText({ value: signer, key: 'email' });
    const role = optionalText({ value: signer, key: 'role' });
    if (email === undefined || role === undefined) {
      throw new Error(`Signer ${index + 1} needs an email and a role name.`);
    }
    const expirationDays = withExpiration ? numberAt({ value: signer, key: 'expiration_days' }) : undefined;
    if (expirationDays !== undefined && (!Number.isInteger(expirationDays) || expirationDays < 3 || expirationDays > 180)) {
      throw new Error(`Signer ${index + 1} expiration days must be a whole number from 3 to 180.`);
    }
    return dropUndefined({
      email: email.trim(),
      role,
      order: numberAt({ value: signer, key: 'order' }) ?? 1,
      subject: optionalText({ value: signer, key: 'subject' }),
      message: optionalText({ value: signer, key: 'message' }),
      redirect_uri: optionalText({ value: signer, key: 'redirect_uri' }),
      language: optionalText({ value: signer, key: 'language' }),
      expiration_days: expirationDays,
    });
  });
}

function dropUndefined(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== ''));
}

function ccList(value: unknown): string[] | undefined {
  const list = stringList(value);
  return list.length > 0 ? list : undefined;
}

function invitesOf(document: unknown): Record<string, unknown>[] {
  const fieldInvites = recordsAt({ value: document, key: 'field_invites' }).map((invite) => ({
    id: textAt({ value: invite, key: 'id' }) ?? null,
    type: 'field',
    email: textAt({ value: invite, key: 'email' }) ?? null,
    role: textAt({ value: invite, key: 'role' }) ?? null,
    status: textAt({ value: invite, key: 'status' }) ?? null,
    created: numberAt({ value: invite, key: 'created' }) ?? null,
  }));
  const freeFormInvites = recordsAt({ value: document, key: 'requests' }).map((request) => {
    const statuses = recordsAt({ value: request, key: 'email_statuses' });
    const lastStatus = statuses.length > 0 ? textAt({ value: statuses[statuses.length - 1], key: 'status' }) : undefined;
    return {
      id: textAt({ value: request, key: 'id' }) ?? null,
      type: 'free_form',
      email: textAt({ value: request, key: 'signer_email' }) ?? null,
      role: null,
      status: isCanceled(request) ? 'canceled' : lastStatus ?? 'pending',
      created: numberAt({ value: request, key: 'created' }) ?? null,
    };
  });
  return [...fieldInvites, ...freeFormInvites];
}

function isCanceled(request: Record<string, unknown>): boolean {
  const value = request['canceled'];
  return value === true || value === 1 || value === '1' || value === 'true';
}

function pendingFreeFormInviteIds(document: unknown): string[] {
  return recordsAt({ value: document, key: 'requests' })
    .filter((request) => !isCanceled(request) && !isCompletedRequest(request))
    .map((request) => textAt({ value: request, key: 'id' }) ?? '')
    .filter((id) => id !== '');
}

function isCompletedRequest(request: Record<string, unknown>): boolean {
  const signatureId = request['signature_id'];
  if (signatureId !== undefined && signatureId !== null && signatureId !== '') {
    return true;
  }
  const fulfilled = request['fulfilled'];
  if (fulfilled === true || fulfilled === 1 || fulfilled === '1') {
    return true;
  }
  const statuses = recordsAt({ value: request, key: 'email_statuses' });
  const last = statuses.length > 0 ? (textAt({ value: statuses[statuses.length - 1], key: 'status' }) ?? '').toLowerCase() : '';
  return last === 'fulfilled' || last === 'signed';
}

function hasPendingFieldInvite(document: unknown): boolean {
  return recordsAt({ value: document, key: 'field_invites' }).some((invite) =>
    PENDING_FIELD_STATUSES.includes((textAt({ value: invite, key: 'status' }) ?? '').toLowerCase())
  );
}

function requiredText({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text === '') {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function roleNamesOf(document: unknown): string[] {
  return recordsAt({ value: document, key: 'roles' })
    .map((role) => textAt({ value: role, key: 'name' }) ?? '')
    .filter((name) => name !== '');
}

const PENDING_FIELD_STATUSES = ['pending', 'created', 'sent'];
const HTTP_METHODS: Record<SendParams['method'], HttpMethod> = {
  GET: HttpMethod.GET,
  POST: HttpMethod.POST,
  PUT: HttpMethod.PUT,
  DELETE: HttpMethod.DELETE,
};
const SIGN_NOW_API_URL = 'https://api.signnow.com';
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ERROR_TEXT = 500;
const UPLOAD_TIMEOUT_MS = 120_000;
const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;

export class SignNowApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
    super(`SignNow ${operation} failed (HTTP ${status}): ${vendorMessage(responseBody)}`);
    this.name = 'SignNowApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export const signNowClient = {
  request,
  download,
  getUser,
  getUserId,
  uploadDocument,
  isNotFound,
  segment,
};

export const signNowData = {
  isRecord,
  optionalText,
  roleSigners,
  dropUndefined,
  ccList,
  invitesOf,
  pendingFreeFormInviteIds,
  hasPendingFieldInvite,
  requiredText,
  roleNamesOf,
  textAt,
  numberAt,
  recordsAt,
  stringList,
};

export type SignNowQuery = Record<string, string | number | boolean | undefined>;

type SendParams = {
  token: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  operation: string;
  query?: SignNowQuery;
  body?: unknown;
  form?: FormData;
  accept?: string;
  timeoutMs?: number;
};

type RawResponse = { status: number; headers: HttpHeaders; body: unknown };
