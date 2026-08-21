import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { ConductorApiError } from './errors';

const CONDUCTOR_API_BASE_URL = 'https://api.conductor.is/v1';
const TRANSIENT_HTTP_RETRIES = 2;

export type ConductorAuth = {
  secretKey: string;
  endUserId: string;
};

export const conductorClient = {
  async request<T>({
    auth,
    method,
    resourceUri,
    body,
    queryParams,
  }: {
    auth: ConductorAuth;
    method: HttpMethod;
    resourceUri: string;
    body?: unknown;
    queryParams?: Record<string, string>;
  }): Promise<T> {
    const request: HttpRequest = {
      method,
      url: `${CONDUCTOR_API_BASE_URL}${resourceUri}`,
      headers: {
        Authorization: `Bearer ${auth.secretKey}`,
        'Conductor-End-User-Id': auth.endUserId,
      },
      body,
      queryParams,
      retries: TRANSIENT_HTTP_RETRIES,
    };
    try {
      const response = await httpClient.sendRequest<T>(request);
      return response.body;
    } catch (error) {
      throw new ConductorApiError(error);
    }
  },

  async healthCheck(auth: ConductorAuth): Promise<{ status: string }> {
    return conductorClient.request<{ status: string }>({
      auth,
      method: HttpMethod.GET,
      resourceUri: '/quickbooks-desktop/health-check',
    });
  },
};

/**
 * Retries an update once when QuickBooks Desktop rejects it for a stale `revisionNumber` — the
 * record changed between the caller's lookup and this update. A second failure propagates as-is.
 */
export async function withStaleRevisionRetry<T>({
  attempt,
  refetchRevisionNumber,
  revisionNumber,
}: {
  attempt: (revisionNumber: string) => Promise<T>;
  refetchRevisionNumber: () => Promise<string>;
  revisionNumber: string;
}): Promise<T> {
  try {
    return await attempt(revisionNumber);
  } catch (error) {
    if (error instanceof ConductorApiError && error.isStaleRevision) {
      const freshRevisionNumber = await refetchRevisionNumber();
      return attempt(freshRevisionNumber);
    }
    throw error;
  }
}

const RECORD_LOCK_RETRY_DELAY_MS = 1500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries a mutating call once when QuickBooks Desktop rejects it because the record is already
 * being processed by another in-flight request against the same company file. No refetch needed,
 * just a short wait. Wrap the outermost call (e.g. around `withStaleRevisionRetry`) so the two
 * retry paths compose instead of nesting bespoke retry logic per action.
 */
export async function withRecordLockRetry<T>(attempt: () => Promise<T>): Promise<T> {
  try {
    return await attempt();
  } catch (error) {
    if (error instanceof ConductorApiError && error.isRecordLocked) {
      await delay(RECORD_LOCK_RETRY_DELAY_MS);
      return attempt();
    }
    throw error;
  }
}
