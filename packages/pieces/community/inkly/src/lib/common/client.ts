import { httpClient, HttpError, HttpMethod, QueryParams } from '@activepieces/pieces-common';

async function request<T>({ apiKey, method, path, body, queryParams, headers }: RequestParams): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Inkly-Client': CLIENT_NAME,
        ...headers,
      },
      body,
      queryParams,
    });
    return response.body;
  } catch (error) {
    throw toInklyError({ error });
  }
}

async function getAccount({ apiKey }: { apiKey: string }): Promise<InklyAccount> {
  return request<InklyAccount>({ apiKey, method: HttpMethod.GET, path: '/me' });
}

async function listTemplates({ apiKey, search }: { apiKey: string; search?: string }): Promise<InklyTemplateSummary[]> {
  const response = await request<{ templates: InklyTemplateSummary[] }>({
    apiKey,
    method: HttpMethod.GET,
    path: '/templates',
    queryParams: { limit: '100', ...(search ? { q: search } : {}) },
  });
  return response.templates;
}

async function getTemplate({ apiKey, templateId }: { apiKey: string; templateId: string }): Promise<InklyTemplate> {
  const response = await request<{ template: InklyTemplate }>({
    apiKey,
    method: HttpMethod.GET,
    path: `/templates/${encodeURIComponent(templateId)}`,
  });
  return response.template;
}

async function listDocuments({
  apiKey,
  search,
  status,
  limit,
}: {
  apiKey: string;
  search?: string;
  status?: InklyDocumentStatus;
  limit: number;
}): Promise<InklyDocumentListItem[]> {
  const response = await request<{ documents: InklyDocumentListItem[] }>({
    apiKey,
    method: HttpMethod.GET,
    path: '/documents',
    queryParams: {
      limit: String(limit),
      ...(search ? { q: search } : {}),
      ...(status ? { status } : {}),
    },
  });
  return response.documents;
}

async function getDocument({ apiKey, documentId }: { apiKey: string; documentId: string }): Promise<InklyDocument> {
  const response = await request<{ document: InklyDocument }>({
    apiKey,
    method: HttpMethod.GET,
    path: `/documents/${encodeURIComponent(documentId)}`,
  });
  return response.document;
}

async function findDocument({ apiKey, documentId }: { apiKey: string; documentId: string }): Promise<InklyDocument | null> {
  try {
    return await getDocument({ apiKey, documentId });
  } catch (error) {
    if (error instanceof InklyError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

async function sendFromTemplate({
  apiKey,
  idempotencyKey,
  body,
}: {
  apiKey: string;
  idempotencyKey: string;
  body: Record<string, unknown>;
}): Promise<InklySendResponse> {
  return request<InklySendResponse>({
    apiKey,
    method: HttpMethod.POST,
    path: '/documents',
    headers: { 'Idempotency-Key': idempotencyKey },
    body,
  });
}

async function createDraft({ apiKey, body }: { apiKey: string; body: Record<string, unknown> }): Promise<InklyDraft> {
  const response = await request<{ document: InklyDraft }>({
    apiKey,
    method: HttpMethod.POST,
    path: '/drafts',
    body,
  });
  return response.document;
}

async function downloadSignedPdf({ apiKey, documentId }: { apiKey: string; documentId: string }): Promise<InklySignedPdf> {
  const link = await request<{ url: string; file_name: string }>({
    apiKey,
    method: HttpMethod.GET,
    path: `/documents/${encodeURIComponent(documentId)}/signed-pdf`,
  });
  const file = await httpClient.sendRequest<ArrayBuffer>({
    method: HttpMethod.GET,
    url: link.url,
    responseType: 'arraybuffer',
  });
  return { fileName: link.file_name, data: Buffer.from(file.body) };
}

async function createWebhookSubscription({
  apiKey,
  url,
  event,
}: {
  apiKey: string;
  url: string;
  event: InklyEventName;
}): Promise<InklyWebhookSubscription> {
  const response = await request<{ subscription: InklyWebhookSubscription }>({
    apiKey,
    method: HttpMethod.POST,
    path: '/webhook-subscriptions',
    body: { url, events: [event] },
  });
  return response.subscription;
}

async function deleteWebhookSubscription({ apiKey, subscriptionId }: { apiKey: string; subscriptionId: string }): Promise<void> {
  try {
    await request<unknown>({
      apiKey,
      method: HttpMethod.DELETE,
      path: `/webhook-subscriptions/${encodeURIComponent(subscriptionId)}`,
    });
  } catch (error) {
    if (error instanceof InklyError && (error.status === 404 || error.status === 401)) {
      return;
    }
    throw error;
  }
}

function toInklyError({ error }: { error: unknown }): Error {
  if (!(error instanceof HttpError)) {
    return error instanceof Error ? error : new Error(String(error));
  }
  const status = error.response.status;
  const detail = readErrorBody(error.response.body);
  const reference = detail?.requestId ? ` (Inkly request ID: ${detail.requestId})` : '';

  if (status === 401) {
    return new InklyError({
      status,
      code: detail?.code ?? 'invalid_api_key',
      message: `Inkly didn't accept this API key. It may have been revoked. Reconnect with a new key from ${API_KEYS_URL}.`,
    });
  }
  if (detail?.code === 'plan_required') {
    return new InklyError({
      status,
      code: detail.code,
      message: `The Inkly API needs a Pro or Teams plan. Upgrade at ${PRICING_URL}, then try again.${reference}`,
    });
  }
  if (detail?.code === 'scope_required') {
    return new InklyError({
      status,
      code: detail.code,
      message: `This API key can't do that. Create a key with "Read and send" access at ${API_KEYS_URL} and reconnect.${reference}`,
    });
  }
  if (status === 429 && (!detail || detail.code === 'rate_limited')) {
    return new InklyError({
      status,
      code: 'rate_limited',
      message: `Inkly is receiving too many requests right now. Try again shortly.${reference}`,
    });
  }
  if (detail) {
    return new InklyError({ status, code: detail.code, message: `${detail.message} (Inkly error code: ${detail.code})${reference}` });
  }
  return new InklyError({ status, code: 'unknown', message: `Inkly answered with status ${status}.` });
}

function readErrorBody(body: unknown): { code: string; message: string; requestId: string | null } | null {
  const parsed = typeof body === 'string' ? parseJson(body) : body;
  if (!isRecord(parsed) || !isRecord(parsed['error'])) {
    return null;
  }
  const { code, message, request_id: requestId } = parsed['error'];
  if (typeof code !== 'string' || typeof message !== 'string') {
    return null;
  }
  return { code, message, requestId: typeof requestId === 'string' ? requestId : null };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

class InklyError extends Error {
  readonly status: number;
  readonly code: string;

  constructor({ status, code, message }: { status: number; code: string; message: string }) {
    super(message);
    this.name = 'InklyError';
    this.status = status;
    this.code = code;
  }
}

const BASE_URL = 'https://www.inkly.so/api/v1';
const API_KEYS_URL = 'https://www.inkly.so/account/api';
const PRICING_URL = 'https://www.inkly.so/pricing';
const CLIENT_NAME = 'activepieces';

export const inklyClient = {
  BASE_URL,
  API_KEYS_URL,
  CLIENT_NAME,
  InklyError,
  isRecord,
  getAccount,
  listTemplates,
  getTemplate,
  listDocuments,
  getDocument,
  findDocument,
  sendFromTemplate,
  createDraft,
  downloadSignedPdf,
  createWebhookSubscription,
  deleteWebhookSubscription,
};

type RequestParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: QueryParams;
  headers?: Record<string, string>;
};

export type InklyEventName = 'document.sent' | 'recipient.signed' | 'document.completed';

export type InklyDocumentStatus = 'draft' | 'sent' | 'completed' | 'declined' | 'voided';

export type InklyAccount = {
  key: { name: string; last_four: string; scopes: string[] };
  workspace: { id: string; name: string; plan: string };
};

export type InklyTemplateSummary = {
  id: string;
  title: string;
  created_at: string;
};

export type InklyTemplate = InklyTemplateSummary & {
  roles: Array<{ role_id: string; label: string; role: 'signer' | 'cc'; in_person: boolean }>;
  prefilled_fields: Array<{ label: string; key: string; required: boolean; type: string }>;
};

export type InklyRecipient = {
  id: string;
  role: 'signer' | 'cc';
  name: string | null;
  email: string | null;
  status: 'pending' | 'viewed' | 'signed' | 'declined';
  viewed_at: string | null;
  signed_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
};

export type InklyDocument = {
  id: string;
  title: string;
  status: InklyDocumentStatus;
  external_id: string | null;
  template_id: string | null;
  source: string;
  created_at: string;
  sent_at: string | null;
  completed_at: string | null;
  voided_at: string | null;
  recipients: InklyRecipient[];
  fields?: Array<{ label: string; value: string | boolean | null }>;
};

export type InklyDocumentListItem = {
  id: string;
  title: string;
  status: InklyDocumentStatus;
  created_at: string;
  recipients: Array<{ name: string | null; email: string | null; role: 'signer' | 'cc'; status: InklyRecipient['status'] }>;
};

export type InklySendResponse = {
  document: {
    id: string;
    title: string;
    status: InklyDocumentStatus;
    external_id: string | null;
    template_id: string | null;
    created_at: string;
  };
  recipients: Array<{
    id: string;
    role_id: string | null;
    role: 'signer' | 'cc';
    name: string | null;
    email: string | null;
    status: InklyRecipient['status'];
  }>;
};

export type InklyDraft = {
  id: string;
  status: 'draft';
  review_url: string;
  app_url: string;
};

export type InklySignedPdf = {
  fileName: string;
  data: Buffer;
};

export type InklyWebhookSubscription = {
  id: string;
  url: string;
  events: string[];
  secret: string;
};
