import { isRecord, normalizeCustomerId } from './client';
import type { GoogleAdsAuthValue } from './client';
import type { UserIdentifier } from './customer-match';

export class DataManagerApiError extends Error {
  readonly status: number;
  readonly googleStatus: string | undefined;
  readonly details: unknown[];

  constructor({ status, googleStatus, details, summary }: DataManagerApiErrorParams) {
    super(summary);
    this.name = 'DataManagerApiError';
    this.status = status;
    this.googleStatus = googleStatus;
    this.details = details;
  }

  static fromResponse({ status, statusText, body }: { status: number; statusText: string; body: unknown }): DataManagerApiError {
    const rpcError = isRecord(body) && isRecord(body['error']) ? body['error'] : {};
    const details = Array.isArray(rpcError['details']) ? rpcError['details'].filter(isRecord) : [];

    const extras = details.flatMap(describeDetail);

    const googleStatus = typeof rpcError['status'] === 'string' ? rpcError['status'] : undefined;
    const head = `Data Manager API returned ${status}${googleStatus ? ` (${googleStatus})` : ''}`;
    const message = typeof rpcError['message'] === 'string' ? rpcError['message'] : statusText || 'no error details';
    const summary = `${head}: ${message}${extras.length > 0 ? ` [${extras.join('; ')}]` : ''}`;

    return new DataManagerApiError({ status, googleStatus, details, summary });
  }
}

export class DataManagerUnreachableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataManagerUnreachableError';
  }
}

export function userListIdFrom({ userList, customerId }: UserListIdParams): string {
  const value = String(userList ?? '').trim();
  if (/^\d+$/.test(value)) {
    return value;
  }
  const match = /^customers\/(\d+)\/userLists\/(\d+)$/.exec(value);
  if (!match) {
    throw new Error(
      `"${value}" is not a user list id or resource name. Use a numeric user list id or a resource name like customers/1234567890/userLists/55.`
    );
  }
  const [, listCustomerId, id] = match;
  const selectedCustomerId = normalizeCustomerId(customerId);
  if (listCustomerId !== selectedCustomerId) {
    throw new Error(
      `Audience list ${value} belongs to customer ${listCustomerId}, but the selected customer is ${selectedCustomerId}. Select customer ${listCustomerId} or pick an audience list of customer ${selectedCustomerId}.`
    );
  }
  return id;
}

export function destinationFor({ auth, customerId, userList }: DestinationParams): Destination {
  const loginCustomerId = auth.props?.loginCustomerId?.trim();
  return {
    operatingAccount: { accountType: 'GOOGLE_ADS', accountId: normalizeCustomerId(customerId) },
    ...(loginCustomerId
      ? { loginAccount: { accountType: 'GOOGLE_ADS' as const, accountId: normalizeCustomerId(loginCustomerId) } }
      : {}),
    productDestinationId: userListIdFrom({ userList, customerId }),
  };
}

function describeDetail(detail: Record<string, unknown>): string[] {
  const violations = Array.isArray(detail['fieldViolations']) ? detail['fieldViolations'].filter(isRecord) : [];
  const fieldMessages = violations.map((v) => `${String(v['field'] ?? '?')}: ${String(v['description'] ?? '')}`.trim());
  const reason = typeof detail['reason'] === 'string' ? [`reason: ${detail['reason']}`] : [];
  return [...fieldMessages, ...reason];
}

async function send({ auth, method, url, body, timeoutMs = REQUEST_TIMEOUT_MS }: SendParams): Promise<unknown> {
  const timeout = Math.max(1, Math.min(timeoutMs, REQUEST_TIMEOUT_MS));
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(timeout),
    });
  } catch (error) {
    throw new DataManagerUnreachableError(describeFailure({ error, timeoutMs: timeout }));
  }
  const reading = await readJson(response);
  if (!response.ok) {
    const body = reading.ok ? reading.value : undefined;
    throw DataManagerApiError.fromResponse({ status: response.status, statusText: response.statusText, body });
  }
  if (!reading.ok) {
    const message = describeUnreadableAnswer({ method, reason: reading.reason });
    throw reading.interrupted ? new DataManagerUnreachableError(message) : new Error(message);
  }
  return reading.value;
}

async function readJson(response: Response): Promise<JsonReading> {
  let text: string;
  try {
    text = await response.text();
  } catch (error) {
    return { ok: false, reason: describeReadFailure(error), interrupted: true };
  }
  if (text.trim() === '') {
    return { ok: true, value: {} };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, reason: 'the body is not valid JSON', interrupted: false };
  }
}

function describeReadFailure(error: unknown): string {
  if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
    return 'reading the body timed out';
  }
  return 'the connection closed while reading the body';
}

function describeUnreadableAnswer({ method, reason }: { method: SendParams['method']; reason: string }): string {
  if (method === 'GET') {
    return `Google answered the status check but its response could not be read (${reason}). Try the status check again.`;
  }
  return `Google accepted the request but its response could not be read (${reason}); the change may have been applied. Check the audience list before retrying.`;
}

function describeFailure({ error, timeoutMs }: { error: unknown; timeoutMs: number }): string {
  if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
    return `Data Manager API did not answer within ${Math.ceil(timeoutMs / 1000)} seconds.`;
  }
  const reason = error instanceof Error ? error.message : 'unknown error';
  return `Could not reach the Data Manager API: ${reason}`;
}

function toSubmitResponse(value: unknown): IngestResponse {
  const requestId = isRecord(value) && typeof value['requestId'] === 'string' ? value['requestId'].trim() : '';
  if (!isRecord(value) || requestId === '') {
    throw new Error(
      'Google accepted the request but did not return a request id, so its processing cannot be tracked; the change may have been applied. Check the audience list before retrying.'
    );
  }
  const warnings = Array.isArray(value['fieldWarnings']) ? value['fieldWarnings'].filter(isRecord).map(toFieldWarning) : [];
  return {
    requestId,
    ...(warnings.length > 0 ? { fieldWarnings: warnings } : {}),
  };
}

function toFieldWarning(value: Record<string, unknown>): FieldWarning {
  return {
    ...optionalString({ value, key: 'field' }),
    ...optionalString({ value, key: 'reason' }),
    ...optionalString({ value, key: 'description' }),
  };
}

function toRequestStatusResponse(value: unknown): RetrieveRequestStatusResponse {
  if (!isRecord(value) || !Array.isArray(value['requestStatusPerDestination'])) {
    return {};
  }
  return { requestStatusPerDestination: value['requestStatusPerDestination'].filter(isRecord).map(toRequestStatusPerDestination) };
}

function toRequestStatusPerDestination(value: Record<string, unknown>): RequestStatusPerDestination {
  const errorInfo = isRecord(value['errorInfo']) ? value['errorInfo'] : undefined;
  const warningInfo = isRecord(value['warningInfo']) ? value['warningInfo'] : undefined;
  const ingestion = isRecord(value['audienceMembersIngestionStatus']) ? value['audienceMembersIngestionStatus'] : undefined;
  const userData = ingestion && isRecord(ingestion['userDataIngestionStatus']) ? ingestion['userDataIngestionStatus'] : undefined;
  return {
    ...(typeof value['requestStatus'] === 'string' ? { requestStatus: value['requestStatus'] } : {}),
    ...(errorInfo ? { errorInfo: { errorCounts: toReasonCounts(errorInfo['errorCounts']) } } : {}),
    ...(warningInfo ? { warningInfo: { warningCounts: toReasonCounts(warningInfo['warningCounts']) } } : {}),
    ...(userData
      ? {
          audienceMembersIngestionStatus: {
            userDataIngestionStatus: {
              ...optionalString({ value: userData, key: 'recordCount' }),
              ...optionalString({ value: userData, key: 'userIdentifierCount' }),
              ...optionalString({ value: userData, key: 'uploadMatchRateRange' }),
            },
          },
        }
      : {}),
  };
}

function toReasonCounts(value: unknown): ReasonCount[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(isRecord)
    .map((count) => ({ ...optionalString({ value: count, key: 'recordCount' }), ...optionalString({ value: count, key: 'reason' }) }));
}

function optionalString({ value, key }: { value: Record<string, unknown>; key: string }): Record<string, string> {
  const field = value[key];
  if (typeof field === 'string') {
    return { [key]: field };
  }
  if (typeof field === 'number') {
    return { [key]: String(field) };
  }
  return {};
}

const REQUEST_TIMEOUT_MS = 60_000;

export const DATA_MANAGER_API_ROOT = 'https://datamanager.googleapis.com';
export const DATA_MANAGER_API_VERSION = 'v1';
const BASE_URL = `${DATA_MANAGER_API_ROOT}/${DATA_MANAGER_API_VERSION}`;
export const REQUEST_STATUS_URL = `${BASE_URL}/requestStatus:retrieve`;

export const DATA_MANAGER_SCOPE = 'https://www.googleapis.com/auth/datamanager';

export const MEMBERS_PER_REQUEST = 10_000;

export const DataManagerApi = {
  async ingestAudienceMembers({ auth, body }: { auth: GoogleAdsAuthValue; body: IngestAudienceMembersRequest }): Promise<IngestResponse> {
    return toSubmitResponse(await send({ auth, method: 'POST', url: `${BASE_URL}/audienceMembers:ingest`, body }));
  },

  async removeAudienceMembers({ auth, body }: { auth: GoogleAdsAuthValue; body: RemoveAudienceMembersRequest }): Promise<RemoveResponse> {
    const { requestId } = toSubmitResponse(await send({ auth, method: 'POST', url: `${BASE_URL}/audienceMembers:remove`, body }));
    return { requestId };
  },

  async retrieveRequestStatus({ auth, requestId, timeoutMs }: RetrieveRequestStatusParams): Promise<RetrieveRequestStatusResponse> {
    const url = `${REQUEST_STATUS_URL}?${new URLSearchParams({ requestId }).toString()}`;
    return toRequestStatusResponse(await send({ auth, method: 'GET', url, timeoutMs }));
  },
};

export type ProductAccount = { accountType: 'GOOGLE_ADS'; accountId: string };

export type Destination = {
  operatingAccount: ProductAccount;
  loginAccount?: ProductAccount;
  productDestinationId: string;
};

export type DataManagerConsentStatus = 'CONSENT_GRANTED' | 'CONSENT_DENIED' | 'CONSENT_STATUS_UNSPECIFIED';

export type DataManagerConsent = {
  adUserData: DataManagerConsentStatus;
  adPersonalization: DataManagerConsentStatus;
};

export type AudienceMember = {
  userData: { userIdentifiers: UserIdentifier[] };
};

export type IngestAudienceMembersRequest = {
  destinations: Destination[];
  audienceMembers: AudienceMember[];
  consent?: DataManagerConsent;
  validateOnly?: boolean;
  encoding: 'HEX';
  termsOfService: { customerMatchTermsOfServiceStatus: 'ACCEPTED' };
};

export type RemoveAudienceMembersRequest = {
  destinations: Destination[];
  audienceMembers: AudienceMember[];
  validateOnly?: boolean;
  encoding: 'HEX';
};

export type IngestResponse = {
  requestId: string;
  fieldWarnings?: FieldWarning[];
};

export type FieldWarning = { reason?: string; description?: string; field?: string };

export type RemoveResponse = {
  requestId: string;
};

export type RequestStatus = 'REQUEST_STATUS_UNKNOWN' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'PARTIAL_SUCCESS';

export type ReasonCount = { recordCount?: string; reason?: string };

export type RequestStatusPerDestination = {
  requestStatus?: RequestStatus | string;
  errorInfo?: { errorCounts?: ReasonCount[] };
  warningInfo?: { warningCounts?: ReasonCount[] };
  audienceMembersIngestionStatus?: {
    userDataIngestionStatus?: { recordCount?: string; userIdentifierCount?: string; uploadMatchRateRange?: string };
  };
};

export type RetrieveRequestStatusResponse = {
  requestStatusPerDestination?: RequestStatusPerDestination[];
};

type SendParams = {
  auth: GoogleAdsAuthValue;
  method: 'GET' | 'POST';
  url: string;
  body?: IngestAudienceMembersRequest | RemoveAudienceMembersRequest;
  timeoutMs?: number;
};

type JsonReading = { ok: true; value: unknown } | { ok: false; reason: string; interrupted: boolean };

type RetrieveRequestStatusParams = { auth: GoogleAdsAuthValue; requestId: string; timeoutMs?: number };

type UserListIdParams = {
  userList: string;
  customerId: string;
};

type DestinationParams = {
  auth: GoogleAdsAuthValue;
  customerId: string;
  userList: string;
};

type DataManagerApiErrorParams = {
  status: number;
  googleStatus: string | undefined;
  details: unknown[];
  summary: string;
};
