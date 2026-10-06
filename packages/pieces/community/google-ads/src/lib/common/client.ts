import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import type { HttpHeaders, HttpRequest } from '@activepieces/pieces-common';

export const API_VERSION = 'v25';
export const GOOGLE_ADS_API_ROOT = 'https://googleads.googleapis.com';
const BASE_URL = `${GOOGLE_ADS_API_ROOT}/${API_VERSION}`;

export function normalizeCustomerId(value: string): string {
  const digits = String(value ?? '')
    .trim()
    .replace(/^customers\//, '')
    .replace(/[-\s]/g, '');
  if (!/^\d{10}$/.test(digits)) {
    throw new Error(
      `Invalid Google Ads customer ID "${value}": expected 10 digits (dashes optional), e.g. 123-456-7890.`
    );
  }
  return digits;
}

export function assertGaql(query: string): string {
  const trimmed = String(query ?? '').trim();
  if (!/^select\s/i.test(trimmed)) {
    throw new Error('The query must be a GAQL SELECT statement, e.g. "SELECT campaign.id, campaign.name FROM campaign".');
  }
  return trimmed;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseJsonBody(body: unknown): unknown {
  if (typeof body !== 'string') {
    return body ?? {};
  }
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

export class GoogleAdsApiError extends Error {
  readonly status: number;
  readonly googleStatus: string | undefined;
  readonly errors: GoogleAdsErrorDetail[];
  readonly requestId: string | undefined;

  constructor({ status, googleStatus, errors, requestId, summary }: GoogleAdsApiErrorParams) {
    super(summary);
    this.name = 'GoogleAdsApiError';
    this.status = status;
    this.googleStatus = googleStatus;
    this.errors = errors;
    this.requestId = requestId;
  }

  static fromHttpError(error: HttpError): GoogleAdsApiError {
    const { status, body } = error.response;
    const rpcError = readRpcError(parseJsonBody(body));
    const failure = rpcError.details.find((detail) => Array.isArray(detail['errors']));
    const rawErrors = failure && Array.isArray(failure['errors']) ? failure['errors'] : [];
    const errors = rawErrors.filter(isRecord).map(toErrorDetail);

    const googleStatus = rpcError.status;
    const requestId = failure && typeof failure['requestId'] === 'string' ? failure['requestId'] : undefined;
    const head = `Google Ads API returned ${status}${googleStatus ? ` (${googleStatus})` : ''}`;
    const detail =
      errors.length > 0
        ? errors
            .map((e) => `${e.code}: ${e.message}${e.field ? ` [${e.field}]` : ''}${e.trigger ? ` (trigger: ${e.trigger})` : ''}`)
            .join('; ')
        : rpcError.message ?? (typeof body === 'string' ? body : JSON.stringify(body ?? null));

    return new GoogleAdsApiError({
      status,
      googleStatus,
      errors,
      requestId,
      summary: `${head}: ${detail}${requestId ? ` [request-id: ${requestId}]` : ''}`,
    });
  }
}

export const GoogleAdsApi = {
  async listAccessibleCustomers(auth: GoogleAdsAuthValue): Promise<string[]> {
    const body = await send<ListAccessibleCustomersResponse>({
      auth,
      request: {
        method: HttpMethod.GET,
        url: `${BASE_URL}/customers:listAccessibleCustomers`,
      },
    });
    return (body.resourceNames ?? []).map((name) => name.replace(/^customers\//, ''));
  },

  async search({ auth, customerId, query, pageToken }: SearchParams): Promise<SearchResponse> {
    return send<SearchResponse>({
      auth,
      request: {
        method: HttpMethod.POST,
        url: `${BASE_URL}/customers/${normalizeCustomerId(customerId)}/googleAds:search`,
        body: compact({
          query: assertGaql(query),
          pageToken,
        }),
      },
    });
  },

  async searchAll({ auth, customerId, query, maxRows = 10_000 }: SearchAllParams): Promise<SearchAllResult> {
    const results: GoogleAdsRow[] = [];
    let pageToken: string | undefined;
    do {
      const page = await GoogleAdsApi.search({ auth, customerId, query, pageToken });
      for (const row of page.results ?? []) {
        if (results.length >= maxRows) {
          return { results, truncated: true };
        }
        results.push(row);
      }
      pageToken = page.nextPageToken;
    } while (pageToken);
    return { results, truncated: false };
  },

  async mutate({ auth, customerId, operations, options = {} }: MutateParams): Promise<MutateResponse> {
    if (operations.length === 0) {
      throw new Error('mutate needs at least one operation.');
    }
    return send<MutateResponse>({
      auth,
      request: {
        method: HttpMethod.POST,
        url: `${BASE_URL}/customers/${normalizeCustomerId(customerId)}/googleAds:mutate`,
        body: compact({
          mutateOperations: operations,
          partialFailure: options.partialFailure,
          validateOnly: options.validateOnly,
          responseContentType: options.responseContentType ?? 'MUTABLE_RESOURCE',
        }),
      },
    });
  },

  async listCustomerClients({ auth, managerId }: { auth: GoogleAdsAuthValue; managerId: string }): Promise<CustomerInfo[]> {
    const { results } = await GoogleAdsApi.searchAll({
      auth,
      customerId: managerId,
      query:
        'SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.test_account, customer_client.level, customer_client.status FROM customer_client ORDER BY customer_client.level, customer_client.descriptive_name',
      maxRows: 500,
    });
    const unusable = new Set(['CANCELED', 'SUSPENDED']);
    return results
      .map((row) => (isRecord(row['customerClient']) ? row['customerClient'] : {}))
      .filter((client) => !unusable.has(String(client['status'] ?? '')))
      .map(toCustomerInfo);
  },

  async customerInfo({ auth, customerId }: { auth: GoogleAdsAuthValue; customerId: string }): Promise<CustomerInfo> {
    const page = await GoogleAdsApi.search({
      auth,
      customerId,
      query: 'SELECT customer.id, customer.descriptive_name, customer.manager, customer.test_account FROM customer LIMIT 1',
    });
    const row = page.results?.[0];
    if (!row) {
      return { id: normalizeCustomerId(customerId) };
    }
    return toCustomerInfo(isRecord(row['customer']) ? row['customer'] : {});
  },
};

function readRpcError(parsed: unknown): RpcError {
  const error = isRecord(parsed) && isRecord(parsed['error']) ? parsed['error'] : {};
  return {
    status: typeof error['status'] === 'string' ? error['status'] : undefined,
    message: typeof error['message'] === 'string' ? error['message'] : undefined,
    details: Array.isArray(error['details']) ? error['details'].filter(isRecord) : [],
  };
}

function toErrorDetail(error: Record<string, unknown>): GoogleAdsErrorDetail {
  const errorCode = isRecord(error['errorCode']) ? error['errorCode'] : {};
  const [enumName, value] = Object.entries(errorCode)[0] ?? ['UnknownError', 'UNKNOWN'];
  const location = isRecord(error['location']) ? error['location'] : {};
  const pathElements = Array.isArray(location['fieldPathElements']) ? location['fieldPathElements'].filter(isRecord) : undefined;
  const field = pathElements
    ?.map((p) => (p['index'] === undefined ? p['fieldName'] : `${String(p['fieldName'])}[${String(p['index'])}]`))
    .filter(Boolean)
    .join('.');
  const trigger = isRecord(error['trigger']) ? error['trigger']['stringValue'] ?? error['trigger']['int64Value'] : undefined;
  return {
    code: `${enumName}.${String(value)}`,
    message: typeof error['message'] === 'string' ? error['message'] : '',
    ...(field ? { field } : {}),
    ...(typeof trigger === 'string' && trigger ? { trigger } : {}),
  };
}

function headersFor(auth: GoogleAdsAuthValue): HttpHeaders {
  const loginCustomerId = auth.props?.loginCustomerId?.trim();
  return loginCustomerId ? { 'login-customer-id': normalizeCustomerId(loginCustomerId) } : {};
}

async function send<T>({ auth, request }: { auth: GoogleAdsAuthValue; request: Omit<HttpRequest, 'authentication' | 'headers'> }): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      ...request,
      headers: headersFor(auth),
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.access_token },
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      throw GoogleAdsApiError.fromHttpError(error);
    }
    throw error;
  }
}

function compact(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));
}

function toCustomerInfo(customer: Record<string, unknown>): CustomerInfo {
  const descriptiveName = customer['descriptiveName'];
  const manager = customer['manager'];
  const testAccount = customer['testAccount'];
  return {
    id: String(customer['id'] ?? ''),
    ...(typeof descriptiveName === 'string' ? { descriptiveName } : {}),
    ...(typeof manager === 'boolean' ? { manager } : {}),
    ...(typeof testAccount === 'boolean' ? { testAccount } : {}),
  };
}

export type GoogleAdsAuthValue = {
  access_token: string;
  props?: { loginCustomerId?: string | undefined } | undefined;
};

export type GoogleAdsRow = Record<string, unknown>;

export type SearchResponse = {
  results?: GoogleAdsRow[];
  nextPageToken?: string;
  fieldMask?: string;
};

export type SearchParams = {
  auth: GoogleAdsAuthValue;
  customerId: string;
  query: string;
  pageToken?: string;
};

export type SearchAllParams = {
  auth: GoogleAdsAuthValue;
  customerId: string;
  query: string;
  maxRows?: number;
};

export type SearchAllResult = { results: GoogleAdsRow[]; truncated: boolean };

export type MutateOperation = Record<string, unknown>;

export type MutateOptions = {
  partialFailure?: boolean;
  validateOnly?: boolean;
  responseContentType?: 'RESOURCE_NAME_ONLY' | 'MUTABLE_RESOURCE';
};

export type MutateParams = {
  auth: GoogleAdsAuthValue;
  customerId: string;
  operations: MutateOperation[];
  options?: MutateOptions;
};

export type MutateOperationResponse = Record<string, { resourceName?: string } & Record<string, unknown>>;

export type MutateResponse = {
  mutateOperationResponses?: MutateOperationResponse[];
  partialFailureError?: unknown;
};

export type CustomerInfo = {
  id: string;
  descriptiveName?: string;
  manager?: boolean;
  testAccount?: boolean;
};

export type GoogleAdsErrorDetail = {
  code: string;
  message: string;
  field?: string;
  trigger?: string;
};

type GoogleAdsApiErrorParams = {
  status: number;
  googleStatus: string | undefined;
  errors: GoogleAdsErrorDetail[];
  requestId: string | undefined;
  summary: string;
};

type ListAccessibleCustomersResponse = { resourceNames?: string[] };

type RpcError = {
  status: string | undefined;
  message: string | undefined;
  details: Record<string, unknown>[];
};
