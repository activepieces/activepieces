import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { ConductorApiError } from './errors';

const CONDUCTOR_API_BASE_URL = 'https://api.conductor.is/v1';
const TRANSIENT_HTTP_RETRIES = 2;

export type ConductorAuth = {
  secretKey: string;
  endUserId: string;
};

export const conductorClient = {
  /**
   * `safeToRetry` (default `true`) controls whether a transient failure (timeout, 5xx) gets
   * `httpClient`'s automatic retry. Conductor has no idempotency-key mechanism — its
   * `Conductor-Request-Id` is a response-only tracking id for support, not something you can send
   * to dedupe a resent request — so retrying a create blindly can duplicate a real accounting
   * record if the original request actually succeeded server-side but its response was lost.
   * Reads are always safe to retry (the default). Updates-by-id are also safe by default: a
   * resent update either lands on the same `revisionNumber` result or gets rejected as stale by
   * `withStaleRevisionRetry`, neither of which duplicates anything. Every call that **creates** a
   * new record (no id in the URL) must explicitly pass `safeToRetry: false`.
   */
  async request<T>({
    auth,
    method,
    resourceUri,
    body,
    queryParams,
    safeToRetry = true,
  }: {
    auth: ConductorAuth;
    method: HttpMethod;
    resourceUri: string;
    body?: unknown;
    queryParams?: Record<string, string>;
    safeToRetry?: boolean;
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
      retries: safeToRetry ? TRANSIENT_HTTP_RETRIES : 0,
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
