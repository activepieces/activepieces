import {
  canonicalizeQuery,
  encodePathSegment,
  signRequest,
  type QueryParams,
} from './signing';

export const PAYMOS_DEFAULT_BASE_URL = 'https://api.paymos.io';
export const PAYMOS_ACTIVEPIECES_USER_AGENT = 'paymos-activepieces/0.1.0';
export const PAYMOS_DEFAULT_MAX_RETRIES = 2;
export const PAYMOS_DEFAULT_BASE_DELAY_MS = 150;
const PAYMOS_MAX_RETRY_DELAY_MS = 30_000;

export const PAYMOS_SANDBOX_INVOICE_STAGES = [
  'paid',
  'overpaid',
  'underpay',
  'cancel',
] as const;

export type PaymosSandboxInvoiceStage =
  (typeof PAYMOS_SANDBOX_INVOICE_STAGES)[number];

export const PAYMOS_REFUND_MODES = ['full', 'overpayment'] as const;

export type PaymosRefundMode = (typeof PAYMOS_REFUND_MODES)[number];

export type PaymosEnvironment = 'production' | 'sandbox';

export interface PaymosApiCredentials {
  publicKey: string;
  secretKey: string;
  webhookSecret?: string;
  baseUrl?: string;
}

export interface ValidatedPaymosCredentials {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  baseUrl: string;
  environment: PaymosEnvironment;
}

export interface PaymosProblemError {
  code: string;
  field?: string | null;
  message: string;
}

export interface PaymosProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  field?: string | null;
  errors?: PaymosProblemError[];
  trace_id?: string;
}

export interface CreateInvoiceInput {
  project_id: string;
  amount: string;
  currency: string;
  external_order_id: string;
  network?: string;
  customer_fee_percent?: number;
  client_id?: string;
}

export interface ListInvoicesInput {
  project_id?: string;
  status?: string | string[];
  external_order_id?: string;
  created_from?: number;
  created_to?: number;
  limit?: number;
  cursor?: string;
}

export interface CancelInvoiceInput {
  invoice_id: string;
  reason: string;
}

export interface SimulateSandboxInvoiceInput {
  invoice_id: string;
  stage: PaymosSandboxInvoiceStage;
}

export interface CreatePaymentChannelInput {
  project_id: string;
  external_id: string;
}

export interface CreateRefundInput {
  invoice_id: string;
  mode: PaymosRefundMode;
  external_order_id: string;
}

export interface PaymosClientOptions {
  fetchImpl?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
  baseDelayMs?: number;
}

export interface PaymosRequestOptions {
  method: 'GET' | 'POST';
  path: string;
  query?: QueryParams;
  body?: Record<string, unknown>;
  requireSandbox?: boolean;
  maxRetries?: number;
}

export function parseProblemDetails(
  rawBody: string,
): PaymosProblemDetails | null {
  if (!rawBody || rawBody.trim() === '') {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const obj = parsed as Record<string, unknown>;
    const problem: PaymosProblemDetails = {};
    if (typeof obj.type === 'string') {
      problem.type = obj.type;
    }
    if (typeof obj.title === 'string') {
      problem.title = obj.title;
    }
    if (typeof obj.status === 'number') {
      problem.status = obj.status;
    }
    if (typeof obj.detail === 'string') {
      problem.detail = obj.detail;
    }
    if (typeof obj.code === 'string') {
      problem.code = obj.code;
    }
    if (typeof obj.field === 'string' || obj.field === null) {
      problem.field = obj.field;
    }
    if (typeof obj.trace_id === 'string') {
      problem.trace_id = obj.trace_id;
    }
    if (Array.isArray(obj.errors)) {
      problem.errors = obj.errors
        .filter(
          (item): item is Record<string, unknown> =>
            item !== null && typeof item === 'object' && !Array.isArray(item),
        )
        .map((item) => {
          const entry: PaymosProblemError = {
            code: typeof item.code === 'string' ? item.code : '',
            message: typeof item.message === 'string' ? item.message : '',
          };
          if (typeof item.field === 'string' || item.field === null) {
            entry.field = item.field;
          }
          return entry;
        });
    }
    return problem;
  } catch {
    return null;
  }
}

export class PaymosApiError extends Error {
  readonly status: number;

  readonly code: string;

  readonly detail: string;

  readonly field: string | null;

  readonly errors: readonly PaymosProblemError[];

  readonly problem: PaymosProblemDetails | null;

  readonly responseBody: string;

  constructor(status: number, responseBody: string) {
    const problem = parseProblemDetails(responseBody);
    const detail =
      problem?.detail ||
      problem?.title ||
      problem?.code ||
      responseBody ||
      'Empty response';
    super(`Paymos API ${status}: ${detail}`);
    this.name = 'PaymosApiError';
    this.status = status;
    this.code = typeof problem?.code === 'string' ? problem.code : '';
    this.detail = detail;
    this.field = typeof problem?.field === 'string' ? problem.field : null;
    this.errors = Array.isArray(problem?.errors) ? problem.errors : [];
    this.problem = problem;
    this.responseBody = responseBody;
  }
}

export function extractPaymosCredentials(
  auth: unknown,
): Partial<PaymosApiCredentials> {
  if (!auth || typeof auth !== 'object') {
    return {};
  }
  const candidate = auth as Record<string, unknown>;
  if (
    'props' in candidate &&
    candidate.props !== null &&
    typeof candidate.props === 'object'
  ) {
    return candidate.props as Partial<PaymosApiCredentials>;
  }
  return candidate as Partial<PaymosApiCredentials>;
}

function normalizeBaseUrl(rawValue: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawValue);
  } catch {
    throw new Error('Paymos API Base URL is not a valid URL.');
  }
  const host = parsed.hostname.toLowerCase();
  const isLoopback =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '[::1]';
  if (
    parsed.protocol !== 'https:' &&
    !(parsed.protocol === 'http:' && isLoopback)
  ) {
    throw new Error(
      'Paymos API Base URL must use HTTPS (HTTP is allowed only for loopback tests).',
    );
  }
  return rawValue.replace(/\/+$/, '');
}

export function validatePaymentApiCredentials(
  raw: Partial<PaymosApiCredentials> | undefined,
): ValidatedPaymosCredentials {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Paymos API credentials are required.');
  }

  const publicKey = String(raw.publicKey ?? '').trim();
  const secretKey = String(raw.secretKey ?? '').trim();
  const webhookSecret = String(raw.webhookSecret ?? '').trim();
  const rawBaseUrl =
    String(raw.baseUrl ?? PAYMOS_DEFAULT_BASE_URL).trim() ||
    PAYMOS_DEFAULT_BASE_URL;

  if (!publicKey) {
    throw new Error(
      'Paymos Public Key is required (expected pk_live_... or pk_test_...).',
    );
  }
  if (publicKey.startsWith('rk_')) {
    throw new Error(
      'Payout API keys (rk_) are not supported in the Paymos Activepieces integration. Use a Payment API key starting with pk_live_ (Production) or pk_test_ (Sandbox).',
    );
  }

  let environment: PaymosEnvironment;
  if (publicKey.startsWith('pk_live_')) {
    environment = 'production';
  } else if (publicKey.startsWith('pk_test_')) {
    environment = 'sandbox';
  } else {
    throw new Error(
      'Invalid Paymos Public Key prefix. Expected a Payment API key starting with pk_live_ (Production) or pk_test_ (Sandbox).',
    );
  }

  if (!secretKey) {
    throw new Error('Paymos Secret Key is required.');
  }

  const baseUrl = normalizeBaseUrl(rawBaseUrl);

  return {
    publicKey,
    secretKey,
    webhookSecret,
    baseUrl,
    environment,
  };
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseRetryAfterMs(
  headerValue: string | null,
  nowMs: number,
): number | null {
  if (!headerValue) {
    return null;
  }
  const trimmed = headerValue.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }
  const parsedDate = Date.parse(trimmed);
  return Number.isNaN(parsedDate) ? null : Math.max(0, parsedDate - nowMs);
}

function requireNonEmptyString(value: unknown, fieldName: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed === '') {
    throw new Error(`${fieldName} is required and cannot be empty.`);
  }
  return trimmed;
}

export class PaymosClient {
  private readonly rawCredentials: Partial<PaymosApiCredentials>;

  private readonly fetchImpl: typeof fetch;

  private readonly now: () => number;

  private readonly sleep: (ms: number) => Promise<void>;

  private readonly defaultMaxRetries: number;

  private readonly baseDelayMs: number;

  constructor(
    credentials: Partial<PaymosApiCredentials>,
    options: PaymosClientOptions = {},
  ) {
    this.rawCredentials = credentials;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.now = options.now ?? (() => Date.now());
    this.sleep = options.sleep ?? defaultSleep;
    this.defaultMaxRetries = options.maxRetries ?? PAYMOS_DEFAULT_MAX_RETRIES;
    this.baseDelayMs = options.baseDelayMs ?? PAYMOS_DEFAULT_BASE_DELAY_MS;
  }

  async request<T = Record<string, unknown>>(
    options: PaymosRequestOptions,
  ): Promise<T> {
    const creds = validatePaymentApiCredentials(this.rawCredentials);
    const method = options.method.toUpperCase() as 'GET' | 'POST';

    if (
      (options.requireSandbox || options.path.startsWith('/v1/sandbox/')) &&
      creds.environment !== 'sandbox'
    ) {
      throw new Error(
        'Sandbox simulation operations require a Sandbox Payment API key (pk_test_). Production keys (pk_live_) cannot call /v1/sandbox/* endpoints.',
      );
    }

    const queryString = options.query ? canonicalizeQuery(options.query) : '';
    const bodyString =
      options.body !== undefined ? JSON.stringify(options.body) : '';
    const url = `${creds.baseUrl}${options.path}${queryString}`;

    const isGet = method === 'GET';
    const maxRetries = isGet
      ? (options.maxRetries ?? this.defaultMaxRetries)
      : 0;

    let attempt = 0;

    while (true) {
      const timestamp = Math.floor(this.now() / 1000);
      const signed = signRequest({
        method,
        path: options.path,
        query: queryString,
        body: bodyString,
        publicKey: creds.publicKey,
        secretKey: creds.secretKey,
        timestamp,
      });

      const headers: Record<string, string> = {
        Authorization: signed.Authorization,
        'X-Request-Timestamp': signed['X-Request-Timestamp'],
        Accept: 'application/json',
        'User-Agent': PAYMOS_ACTIVEPIECES_USER_AGENT,
      };
      if (bodyString !== '') {
        headers['Content-Type'] = 'application/json';
      }

      try {
        const response = await this.fetchImpl(url, {
          method,
          headers,
          ...(bodyString !== '' ? { body: bodyString } : {}),
        });

        const statusCode = response.status;
        if (
          (statusCode === 429 || (statusCode >= 500 && statusCode <= 599)) &&
          isGet &&
          attempt < maxRetries
        ) {
          const retryAfter = parseRetryAfterMs(
            response.headers?.get('retry-after') ?? null,
            this.now(),
          );
          const backoff = this.baseDelayMs * 2 ** attempt;
          const delayMs = Math.min(
            Math.max(backoff, retryAfter ?? 0),
            PAYMOS_MAX_RETRY_DELAY_MS,
          );
          attempt += 1;
          if (delayMs > 0) {
            await this.sleep(delayMs);
          }
          continue;
        }

        const rawText = await response.text();
        if (statusCode < 200 || statusCode >= 300) {
          throw new PaymosApiError(statusCode, rawText);
        }

        if (rawText.trim() === '') {
          return {} as T;
        }
        try {
          return JSON.parse(rawText) as T;
        } catch (error) {
          throw new Error('Paymos API returned invalid JSON.', { cause: error });
        }
      } catch (error) {
        if (error instanceof PaymosApiError) {
          throw error;
        }
        if (isGet && attempt < maxRetries) {
          const delayMs = Math.min(
            this.baseDelayMs * 2 ** attempt,
            PAYMOS_MAX_RETRY_DELAY_MS,
          );
          attempt += 1;
          if (delayMs > 0) {
            await this.sleep(delayMs);
          }
          continue;
        }
        throw error;
      }
    }
  }

  async validateCredentials(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>({
      method: 'GET',
      path: '/v1/invoices',
      query: { limit: 1 },
      maxRetries: 0,
    });
  }

  async createInvoice(
    input: CreateInvoiceInput,
  ): Promise<Record<string, unknown>> {
    const projectId = requireNonEmptyString(input.project_id, 'project_id');
    const amount = requireNonEmptyString(input.amount, 'amount');
    const currency = requireNonEmptyString(input.currency, 'currency');
    const externalOrderId = requireNonEmptyString(
      input.external_order_id,
      'external_order_id',
    );
    if (externalOrderId.startsWith('wgt_')) {
      throw new Error(
        'external_order_id cannot start with "wgt_" (reserved for Paymos payment widgets).',
      );
    }

    const body: Record<string, unknown> = {
      project_id: projectId,
      amount,
      currency,
      external_order_id: externalOrderId,
    };

    if (typeof input.network === 'string' && input.network.trim() !== '') {
      body.network = input.network.trim();
    }
    if (
      typeof input.customer_fee_percent === 'number' &&
      !Number.isNaN(input.customer_fee_percent)
    ) {
      if (input.customer_fee_percent < 0 || input.customer_fee_percent > 100) {
        throw new Error('customer_fee_percent must be between 0 and 100.');
      }
      body.customer_fee_percent = input.customer_fee_percent;
    }
    if (typeof input.client_id === 'string' && input.client_id.trim() !== '') {
      body.client_id = input.client_id.trim();
    }

    return this.request<Record<string, unknown>>({
      method: 'POST',
      path: '/v1/invoices',
      body,
    });
  }

  async getInvoice(invoiceId: string): Promise<Record<string, unknown>> {
    const id = requireNonEmptyString(invoiceId, 'invoice_id');
    return this.request<Record<string, unknown>>({
      method: 'GET',
      path: `/v1/invoices/${encodePathSegment(id)}`,
    });
  }

  async listInvoices(
    filters: ListInvoicesInput = {},
  ): Promise<Record<string, unknown>> {
    const query: QueryParams = {};
    if (
      typeof filters.project_id === 'string' &&
      filters.project_id.trim() !== ''
    ) {
      query.project_id = filters.project_id.trim();
    }
    if (Array.isArray(filters.status) && filters.status.length > 0) {
      const cleaned = filters.status
        .map((s) => s.trim())
        .filter((s) => s !== '');
      if (cleaned.length > 0) {
        query.status = cleaned;
      }
    } else if (
      typeof filters.status === 'string' &&
      filters.status.trim() !== ''
    ) {
      query.status = filters.status.trim();
    }
    if (
      typeof filters.external_order_id === 'string' &&
      filters.external_order_id.trim() !== ''
    ) {
      query.external_order_id = filters.external_order_id.trim();
    }
    if (
      typeof filters.created_from === 'number' &&
      Number.isFinite(filters.created_from)
    ) {
      query.created_from = Math.floor(filters.created_from);
    }
    if (
      typeof filters.created_to === 'number' &&
      Number.isFinite(filters.created_to)
    ) {
      query.created_to = Math.floor(filters.created_to);
    }
    if (typeof filters.limit === 'number' && Number.isFinite(filters.limit)) {
      query.limit = Math.floor(filters.limit);
    }
    if (typeof filters.cursor === 'string' && filters.cursor.trim() !== '') {
      query.cursor = filters.cursor.trim();
    }

    return this.request<Record<string, unknown>>({
      method: 'GET',
      path: '/v1/invoices',
      query,
    });
  }

  async cancelInvoice(
    input: CancelInvoiceInput,
  ): Promise<Record<string, unknown>> {
    const invoiceId = requireNonEmptyString(input.invoice_id, 'invoice_id');
    const reason = requireNonEmptyString(input.reason, 'reason');
    if (reason.length > 500) {
      throw new Error('reason must be at most 500 characters.');
    }
    return this.request<Record<string, unknown>>({
      method: 'POST',
      path: `/v1/invoices/${encodePathSegment(invoiceId)}/cancel`,
      body: { reason },
    });
  }

  async simulateSandboxInvoice(
    input: SimulateSandboxInvoiceInput,
  ): Promise<Record<string, unknown>> {
    const invoiceId = requireNonEmptyString(input.invoice_id, 'invoice_id');
    const stage = requireNonEmptyString(
      input.stage,
      'stage',
    ) as PaymosSandboxInvoiceStage;
    if (!PAYMOS_SANDBOX_INVOICE_STAGES.includes(stage)) {
      throw new Error(
        `stage must be one of: ${PAYMOS_SANDBOX_INVOICE_STAGES.join(', ')}.`,
      );
    }
    return this.request<Record<string, unknown>>({
      method: 'POST',
      path: `/v1/sandbox/invoices/${encodePathSegment(invoiceId)}/simulate-payment`,
      body: { stage },
      requireSandbox: true,
    });
  }

  async createPaymentChannel(
    input: CreatePaymentChannelInput,
  ): Promise<Record<string, unknown>> {
    const projectId = requireNonEmptyString(input.project_id, 'project_id');
    const externalId = requireNonEmptyString(input.external_id, 'external_id');
    return this.request<Record<string, unknown>>({
      method: 'POST',
      path: '/v1/payment-channels',
      body: {
        project_id: projectId,
        external_id: externalId,
      },
    });
  }

  async getPaymentChannel(
    channelId: string,
  ): Promise<Record<string, unknown>> {
    const id = requireNonEmptyString(channelId, 'channel_id');
    return this.request<Record<string, unknown>>({
      method: 'GET',
      path: `/v1/payment-channels/${encodePathSegment(id)}`,
    });
  }

  async createRefund(
    input: CreateRefundInput,
  ): Promise<Record<string, unknown>> {
    const invoiceId = requireNonEmptyString(input.invoice_id, 'invoice_id');
    const mode = requireNonEmptyString(input.mode, 'mode') as PaymosRefundMode;
    if (!PAYMOS_REFUND_MODES.includes(mode)) {
      throw new Error(
        `mode must be one of: ${PAYMOS_REFUND_MODES.join(', ')}.`,
      );
    }
    const externalOrderId = requireNonEmptyString(
      input.external_order_id,
      'external_order_id',
    );
    // Strict 3-field payload: server CreateRefundRequest disallows unmapped fields.
    return this.request<Record<string, unknown>>({
      method: 'POST',
      path: '/v1/refunds',
      body: {
        invoice_id: invoiceId,
        mode,
        external_order_id: externalOrderId,
      },
    });
  }
}
