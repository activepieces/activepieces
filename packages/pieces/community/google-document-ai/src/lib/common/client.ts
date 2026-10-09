import type { ResolvedAuth } from './token';

export function apiRoot(location: string): string {
  return `https://${location}-documentai.googleapis.com`;
}

export function apiBase(location: string): string {
  return `${apiRoot(location)}/${API_VERSION}`;
}

export function parentOf(auth: Pick<ResolvedAuth, 'projectId' | 'location'>): string {
  return `projects/${auth.projectId}/locations/${auth.location}`;
}

export class GoogleDocumentAiApiError extends Error {
  readonly status: number;
  readonly googleStatus: string | undefined;
  readonly reason: string | undefined;
  readonly googleMessage: string | undefined;
  readonly fieldViolations: FieldViolation[];

  constructor({ status, googleStatus, reason, googleMessage, fieldViolations, summary }: GoogleDocumentAiApiErrorParams) {
    super(summary);
    this.name = 'GoogleDocumentAiApiError';
    this.status = status;
    this.googleStatus = googleStatus;
    this.reason = reason;
    this.googleMessage = googleMessage;
    this.fieldViolations = fieldViolations;
  }

  static fromResponse({ status, body }: { status: number; body: unknown }): GoogleDocumentAiApiError {
    const parsed = parseGoogleError(body);
    const googleStatus = parsed.status;
    const googleMessage = parsed.message;
    const reason = parsed.details.find((d) => d.reason !== undefined)?.reason;
    const fieldViolations = parsed.details.flatMap((d) => d.fieldViolations);

    const head = `Google Document AI returned ${status}${googleStatus ? ` (${googleStatus})` : ''}`;
    const detail = googleMessage ?? truncate(typeof body === 'string' ? body : JSON.stringify(body ?? null));
    const violations = fieldViolations.length > 0 ? ` [${fieldViolations.map((v) => `${v.field ?? '?'}: ${v.description ?? ''}`).join('; ')}]` : '';
    const hint = hintFor({ status, reason, message: googleMessage });
    return new GoogleDocumentAiApiError({
      status,
      googleStatus,
      reason,
      googleMessage,
      fieldViolations,
      summary: `${head}: ${detail}${violations}${reason ? ` [reason: ${reason}]` : ''}${hint}`,
    });
  }
}

export function processorResourceName({ auth, processor, version }: { auth: Pick<ResolvedAuth, 'projectId' | 'location'>; processor: string; version?: string }): string {
  const trimmed = String(processor ?? '').trim();
  if (trimmed === '') {
    throw new Error('Pick a processor.');
  }
  let name: string;
  if (trimmed.startsWith('projects/')) {
    if (!/^projects\/[^/]+\/locations\/[^/]+\/processors\/[^/]+(\/processorVersions\/[^/]+)?$/.test(trimmed)) {
      throw new Error(`"${trimmed}" is not a processor resource name (expected projects/<project>/locations/<location>/processors/<id>).`);
    }
    name = trimmed;
  } else if (/^[a-z0-9]+$/i.test(trimmed)) {
    name = `${parentOf(auth)}/processors/${trimmed}`;
  } else {
    throw new Error(`"${trimmed}" is not a processor id or resource name.`);
  }
  const v = String(version ?? '').trim();
  if (v === '') return name;
  if (name.includes('/processorVersions/')) {
    throw new Error('The processor name already carries a version; leave Processor Version empty or pass the bare processor.');
  }
  return v.startsWith('projects/') ? v : `${name}/processorVersions/${v.replace(/^processorVersions\//, '')}`;
}

function hintFor({ status, reason, message }: { status: number; reason: string | undefined; message: string | undefined }): string {
  const text = `${reason ?? ''} ${message ?? ''}`;
  if (reason === 'SERVICE_DISABLED' || /has not been used in project|is disabled/i.test(text)) {
    return ' Enable the Cloud Document AI API in the Google Cloud project of the connection.';
  }
  if (reason === 'BILLING_DISABLED' || /billing/i.test(text)) {
    return ' Document AI needs billing enabled on the Google Cloud project.';
  }
  if (status === 403) {
    return ' Grant the connection\'s account the role Document AI API User (roles/documentai.apiUser) on the project.';
  }
  if (status === 404 && /processor/i.test(text)) {
    return ' Check the processor ID and that the connection\'s project and location match where the processor was created.';
  }
  if (/page|pages/i.test(text) && /limit|exceed|maximum/i.test(text)) {
    return ' Online processing accepts up to 15 pages (30 with Imageless Mode); select pages or split the file.';
  }
  return '';
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function parseGoogleError(value: unknown): ParsedGoogleError {
  const error = isRecord(value) ? value['error'] : undefined;
  if (!isRecord(error)) {
    return { status: undefined, message: undefined, details: [] };
  }
  const details = Array.isArray(error['details']) ? error['details'] : [];
  return {
    status: optionalString(error['status']),
    message: optionalString(error['message']),
    details: details.filter(isRecord).map((detail) => ({
      reason: optionalString(detail['reason']),
      fieldViolations: Array.isArray(detail['fieldViolations'])
        ? detail['fieldViolations'].filter(isRecord).map((violation) => {
            const field = optionalString(violation['field']);
            const description = optionalString(violation['description']);
            return { ...(field !== undefined ? { field } : {}), ...(description !== undefined ? { description } : {}) };
          })
        : [],
    })),
  };
}

function truncate(text: string): string {
  return text.length > MAX_RAW_ERROR_LENGTH ? `${text.slice(0, MAX_RAW_ERROR_LENGTH)}...` : text;
}

function isProcessor(value: unknown): value is Processor {
  return isRecord(value) && typeof value['name'] === 'string';
}

function isListProcessorsResponse(value: unknown): value is ListProcessorsResponse {
  if (!isRecord(value)) return false;
  const processors = value['processors'];
  const nextPageToken = value['nextPageToken'];
  return (processors === undefined || (Array.isArray(processors) && processors.every(isProcessor))) && (nextPageToken === undefined || typeof nextPageToken === 'string');
}

function isProcessResponse(value: unknown): value is ProcessResponse {
  if (!isRecord(value)) return false;
  const document = value['document'];
  const humanReviewStatus = value['humanReviewStatus'];
  return (document === undefined || isRecord(document)) && (humanReviewStatus === undefined || isRecord(humanReviewStatus));
}

function buildUrl({ url, queryParams }: { url: string; queryParams: Record<string, string | number | undefined> | undefined }): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams ?? {})) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text === '' ? url : `${url}?${text}`;
}

function isDeadlineExceeded({ error, signal }: { error: unknown; signal: AbortSignal }): boolean {
  return signal.aborted || (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError'));
}

function timeoutError({ timeoutMs, hint }: { timeoutMs: number; hint: string | undefined }): Error {
  return new Error(`Google Document AI did not answer within ${Math.round(timeoutMs / 1000)} seconds. Try again in a moment.${hint ? ` ${hint}` : ''}`);
}

async function send<T>({ auth, request, isExpected }: { auth: ResolvedAuth; request: ApiRequest; isExpected: (value: unknown) => value is T }): Promise<T> {
  const signal = AbortSignal.timeout(request.timeoutMs);
  const headers: Record<string, string> = { Authorization: `Bearer ${auth.accessToken}`, Accept: 'application/json' };
  if (request.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  let response: Response;
  try {
    response = await fetch(buildUrl({ url: request.url, queryParams: request.queryParams }), {
      method: request.method,
      headers,
      ...(request.body !== undefined ? { body: JSON.stringify(request.body) } : {}),
      signal,
    });
  } catch (error) {
    if (isDeadlineExceeded({ error, signal })) {
      throw timeoutError({ timeoutMs: request.timeoutMs, hint: request.timeoutHint });
    }
    throw new Error(`Could not reach Google Document AI: ${error instanceof Error ? error.message : 'network error'}`);
  }
  let text: string;
  try {
    text = await response.text();
  } catch (error) {
    if (isDeadlineExceeded({ error, signal })) {
      throw timeoutError({ timeoutMs: request.timeoutMs, hint: request.timeoutHint });
    }
    throw new Error(`Google Document AI returned ${response.status} with an unreadable body.`);
  }
  const body = text === '' ? undefined : safeJson(text);
  if (!response.ok) {
    throw GoogleDocumentAiApiError.fromResponse({ status: response.status, body });
  }
  if (!isExpected(body)) {
    throw new Error(`Google Document AI returned ${response.status} with an unexpected response body.`);
  }
  return body;
}

export const GoogleDocumentAiApi = {
  async listProcessors(auth: ResolvedAuth): Promise<Processor[]> {
    const processors: Processor[] = [];
    let pageToken: string | undefined;
    do {
      const page = await send({
        auth,
        request: {
          method: 'GET',
          url: `${apiBase(auth.location)}/${parentOf(auth)}/processors`,
          queryParams: { pageSize: 100, pageToken },
          timeoutMs: METADATA_TIMEOUT_MS,
        },
        isExpected: isListProcessorsResponse,
      });
      processors.push(...(page.processors ?? []));
      pageToken = page.nextPageToken;
    } while (pageToken);
    return processors;
  },

  async getProcessor({ auth, processor }: { auth: ResolvedAuth; processor: string }): Promise<Processor> {
    return send({
      auth,
      request: {
        method: 'GET',
        url: `${apiBase(auth.location)}/${processorResourceName({ auth, processor })}`,
        timeoutMs: METADATA_TIMEOUT_MS,
      },
      isExpected: isProcessor,
    });
  },

  async process({ auth, processorName, request }: { auth: ResolvedAuth; processorName: string; request: ProcessRequest }): Promise<ProcessResponse> {
    if (!request.rawDocument && !request.gcsDocument) {
      throw new Error('process needs a rawDocument or a gcsDocument.');
    }
    return send({
      auth,
      request: {
        method: 'POST',
        url: `${apiBase(auth.location)}/${processorName}:process`,
        body: request,
        timeoutMs: PROCESS_TIMEOUT_MS,
        timeoutHint: 'For large files, select fewer pages or turn on Imageless Mode.',
      },
      isExpected: isProcessResponse,
    });
  },
};

const METADATA_TIMEOUT_MS = 30_000;
const PROCESS_TIMEOUT_MS = 120_000;
const MAX_RAW_ERROR_LENGTH = 500;

export const API_VERSION = 'v1';

export type Processor = {
  name: string;
  type?: string;
  displayName?: string;
  state?: string;
  defaultProcessorVersion?: string;
  processEndpoint?: string;
  createTime?: string;
};

export type DocumentAiDocument = {
  text?: string;
  mimeType?: string;
  uri?: string;
  entities?: RawEntity[];
  pages?: RawPage[];
  error?: { code?: number; message?: string };
  [key: string]: unknown;
};

export type ProcessRequest = {
  rawDocument?: { content: string; mimeType: string; displayName?: string };
  gcsDocument?: { gcsUri: string; mimeType: string };
  fieldMask?: string;
  imagelessMode?: boolean;
  processOptions?: Record<string, unknown>;
  labels?: Record<string, string>;
};

export type ProcessResponse = { document?: DocumentAiDocument; humanReviewStatus?: Record<string, unknown> };

export type TextAnchor = { textSegments?: { startIndex?: string | number; endIndex?: string | number }[]; content?: string };

export type Layout = { textAnchor?: TextAnchor; confidence?: number };

export type RawEntity = {
  type?: string;
  mentionText?: string;
  textAnchor?: TextAnchor;
  confidence?: number;
  normalizedValue?: Record<string, unknown> & { text?: string };
  id?: string;
  pageAnchor?: { pageRefs?: { page?: string | number }[] };
  properties?: RawEntity[];
};

export type RawPage = {
  pageNumber?: number;
  formFields?: { fieldName?: Layout; fieldValue?: Layout; valueType?: string }[];
  tables?: {
    headerRows?: { cells?: { layout?: Layout }[] }[];
    bodyRows?: { cells?: { layout?: Layout }[] }[];
  }[];
  detectedLanguages?: { languageCode?: string; confidence?: number }[];
};

type FieldViolation = { field?: string; description?: string };

type GoogleDocumentAiApiErrorParams = {
  status: number;
  googleStatus: string | undefined;
  reason: string | undefined;
  googleMessage: string | undefined;
  fieldViolations: FieldViolation[];
  summary: string;
};

type ParsedGoogleError = {
  status: string | undefined;
  message: string | undefined;
  details: { reason: string | undefined; fieldViolations: FieldViolation[] }[];
};

type ListProcessorsResponse = { processors?: Processor[]; nextPageToken?: string };

type ApiRequest = {
  method: 'GET' | 'POST';
  url: string;
  queryParams?: Record<string, string | number | undefined>;
  body?: unknown;
  timeoutMs: number;
  timeoutHint?: string;
};
