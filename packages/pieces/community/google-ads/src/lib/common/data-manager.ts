import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import type { HttpRequest } from '@activepieces/pieces-common';

import { isRecord, normalizeCustomerId, parseJsonBody } from './client';
import type { GoogleAdsAuthValue } from './client';
import type { UserIdentifier } from './customer-match';

export const DATA_MANAGER_API_ROOT = 'https://datamanager.googleapis.com';
export const DATA_MANAGER_API_VERSION = 'v1';
const BASE_URL = `${DATA_MANAGER_API_ROOT}/${DATA_MANAGER_API_VERSION}`;

export const DATA_MANAGER_SCOPE = 'https://www.googleapis.com/auth/datamanager';

export const MEMBERS_PER_REQUEST = 10_000;

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

  static fromHttpError(error: HttpError): DataManagerApiError {
    const { status, body } = error.response;
    const parsed = parseJsonBody(body);
    const rpcError = isRecord(parsed) && isRecord(parsed['error']) ? parsed['error'] : {};
    const details = Array.isArray(rpcError['details']) ? rpcError['details'].filter(isRecord) : [];

    const extras = details.flatMap(describeDetail);

    const googleStatus = typeof rpcError['status'] === 'string' ? rpcError['status'] : undefined;
    const head = `Data Manager API returned ${status}${googleStatus ? ` (${googleStatus})` : ''}`;
    const message =
      typeof rpcError['message'] === 'string'
        ? rpcError['message']
        : typeof body === 'string'
          ? body
          : JSON.stringify(body ?? null);
    const summary = `${head}: ${message}${extras.length > 0 ? ` [${extras.join('; ')}]` : ''}`;

    return new DataManagerApiError({ status, googleStatus, details, summary });
  }
}

export function userListIdFrom(value: string): string {
  const id = String(value ?? '')
    .trim()
    .split('/')
    .pop();
  if (!id || !/^\d+$/.test(id)) {
    throw new Error(`"${value}" is not a user list id or resource name (customers/<id>/userLists/<id>).`);
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
    productDestinationId: userListIdFrom(userList),
  };
}

export const DataManagerApi = {
  async ingestAudienceMembers({ auth, body }: { auth: GoogleAdsAuthValue; body: IngestAudienceMembersRequest }): Promise<IngestResponse> {
    return send<IngestResponse>({
      auth,
      request: {
        method: HttpMethod.POST,
        url: `${BASE_URL}/audienceMembers:ingest`,
        body,
      },
    });
  },

  async removeAudienceMembers({ auth, body }: { auth: GoogleAdsAuthValue; body: RemoveAudienceMembersRequest }): Promise<RemoveResponse> {
    return send<RemoveResponse>({
      auth,
      request: {
        method: HttpMethod.POST,
        url: `${BASE_URL}/audienceMembers:remove`,
        body,
      },
    });
  },

  async retrieveRequestStatus({ auth, requestId }: { auth: GoogleAdsAuthValue; requestId: string }): Promise<RetrieveRequestStatusResponse> {
    return send<RetrieveRequestStatusResponse>({
      auth,
      request: {
        method: HttpMethod.GET,
        url: `${BASE_URL}/requestStatus:retrieve`,
        queryParams: { requestId },
      },
    });
  },
};

function describeDetail(detail: Record<string, unknown>): string[] {
  const violations = Array.isArray(detail['fieldViolations']) ? detail['fieldViolations'].filter(isRecord) : [];
  const fieldMessages = violations.map((v) => `${String(v['field'] ?? '?')}: ${String(v['description'] ?? '')}`.trim());
  const reason = typeof detail['reason'] === 'string' ? [`reason: ${detail['reason']}`] : [];
  return [...fieldMessages, ...reason];
}

async function send<T>({ auth, request }: { auth: GoogleAdsAuthValue; request: Omit<HttpRequest, 'authentication'> }): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      ...request,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.access_token },
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      throw DataManagerApiError.fromHttpError(error);
    }
    throw error;
  }
}

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
  requestId?: string;
  fieldWarnings?: unknown[];
};

export type RemoveResponse = {
  requestId?: string;
};

export type RequestStatus = 'REQUEST_STATUS_UNKNOWN' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'PARTIAL_SUCCESS';

export type ReasonCount = { recordCount?: string; reason?: string };

export type RequestStatusPerDestination = {
  destination?: Destination;
  requestStatus?: RequestStatus | string;
  errorInfo?: { errorCounts?: ReasonCount[] };
  warningInfo?: { warningCounts?: ReasonCount[] };
  audienceMembersIngestionStatus?: {
    userDataIngestionStatus?: { recordCount?: string; userIdentifierCount?: string; uploadMatchRateRange?: string };
    [key: string]: unknown;
  };
  audienceMembersRemovalStatus?: Record<string, unknown>;
};

export type RetrieveRequestStatusResponse = {
  requestStatusPerDestination?: RequestStatusPerDestination[];
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
