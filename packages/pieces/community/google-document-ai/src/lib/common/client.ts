import { AuthenticationType, HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import type { HttpRequest, QueryParams } from '@activepieces/pieces-common';

import type { ResolvedAuth } from './token';

export const API_VERSION = 'v1';

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

  static fromHttpError(error: HttpError): GoogleDocumentAiApiError {
    const { status, body } = error.response;
    const parsed = parseGoogleError(typeof body === 'string' ? safeJson(body) : body ?? {});
    const googleStatus = parsed.status;
    const googleMessage = parsed.message;
    const reason = parsed.details.find((d) => d.reason !== undefined)?.reason;
    const fieldViolations = parsed.details.flatMap((d) => d.fieldViolations);

    const head = `Google Document AI returned ${status}${googleStatus ? ` (${googleStatus})` : ''}`;
    const detail = googleMessage ?? (typeof body === 'string' ? body : JSON.stringify(body ?? null));
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

export const GoogleDocumentAiApi = {
  async listProcessors(auth: ResolvedAuth): Promise<Processor[]> {
    const processors: Processor[] = [];
    let pageToken: string | undefined;
    do {
      const page = await send<ListProcessorsResponse>({
        auth,
        request: {
          method: HttpMethod.GET,
          url: `${apiBase(auth.location)}/${parentOf(auth)}/processors`,
          queryParams: query({ pageSize: 100, pageToken }),
        },
      });
      processors.push(...(page.processors ?? []));
      pageToken = page.nextPageToken;
    } while (pageToken);
    return processors;
  },

  async getProcessor({ auth, processor }: { auth: ResolvedAuth; processor: string }): Promise<Processor> {
    return send<Processor>({
      auth,
      request: {
        method: HttpMethod.GET,
        url: `${apiBase(auth.location)}/${processorResourceName({ auth, processor })}`,
      },
    });
  },

  async process({ auth, processorName, request }: { auth: ResolvedAuth; processorName: string; request: ProcessRequest }): Promise<ProcessResponse> {
    if (!request.rawDocument && !request.gcsDocument) {
      throw new Error('process needs a rawDocument or a gcsDocument.');
    }
    return send<ProcessResponse>({
      auth,
      request: {
        method: HttpMethod.POST,
        url: `${apiBase(auth.location)}/${processorName}:process`,
        body: request,
      },
    });
  },
};

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

async function send<T>({ auth, request }: { auth: ResolvedAuth; request: Omit<HttpRequest, 'authentication'> }): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      ...request,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.accessToken },
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      throw GoogleDocumentAiApiError.fromHttpError(error);
    }
    throw error;
  }
}

function query(params: Record<string, string | number | undefined>): QueryParams {
  const out: QueryParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    out[key] = String(value);
  }
  return out;
}

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
