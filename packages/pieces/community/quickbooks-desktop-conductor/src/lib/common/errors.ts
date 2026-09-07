const TRANSIENT_CONDUCTOR_ERROR_CODES = new Set([
  'QBD_CONNECTION_ERROR',
  'QBD_REQUEST_TIMEOUT',
]);

// QuickBooks Desktop raises an error, not an empty result, when an exact-match filter (e.g.
// `fullNames`) matches zero records. Conductor passes it through as a QBD_REQUEST_ERROR.
const NOT_FOUND_MESSAGE_PATTERN = /could not be found in QuickBooks/i;

// QuickBooks Desktop's optimistic-concurrency check: an update whose `revisionNumber` no longer
// matches the record's current one fails with this message. Recoverable by re-fetching and
// retrying once — see `withStaleRevisionRetry` in `client.ts`.
const STALE_REVISION_MESSAGE_PATTERN = /revision number \(edit sequence\).*is out-of-date/i;

// QuickBooks Desktop itself processes one request at a time per company file, so two requests
// touching the same record close together get this rejection on the loser. Real at scale —
// concurrent flow runs, or someone editing the same record by hand — not an edge case. No new
// data needed to recover, just a short wait and retry — see `withRecordLockRetry` in `client.ts`.
const RECORD_LOCKED_MESSAGE_PATTERN = /already in use/i;

type ConductorErrorBody = {
  error?: {
    message?: string;
    userFacingMessage?: string;
    type?: string;
    code?: string;
    httpStatusCode?: number;
  };
};

function safeJsonParse(value: string): ConductorErrorBody | undefined {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function parseConductorError(error: unknown): {
  message: string;
  code?: string;
  type?: string;
  httpStatusCode?: number;
} {
  const responseBody = (error as { response?: { body?: ConductorErrorBody | string } })?.response?.body;
  const parsedBody = typeof responseBody === 'string' ? safeJsonParse(responseBody) : responseBody;
  const conductorError = parsedBody?.error;
  if (conductorError) {
    return {
      // userFacingMessage is accurate and worth surfacing verbatim for real QuickBooks errors —
      // except INVALID_REQUEST_ERROR (Conductor's own request-shape validation, before it ever
      // reaches QuickBooks), which ships a useless generic userFacingMessage while `message`
      // already has the real, specific reason. Prefer `message` for that one type only.
      message:
        conductorError.type === 'INVALID_REQUEST_ERROR'
          ? conductorError.message ?? conductorError.userFacingMessage ?? 'Unknown Conductor error'
          : conductorError.userFacingMessage ?? conductorError.message ?? 'Unknown Conductor error',
      code: conductorError.code,
      type: conductorError.type,
      httpStatusCode: conductorError.httpStatusCode,
    };
  }
  return { message: error instanceof Error ? error.message : 'Unknown Conductor error' };
}

export class ConductorApiError extends Error {
  readonly code?: string;
  readonly type?: string;
  readonly httpStatusCode?: number;
  readonly isTransient: boolean;
  /**
   * True when this error is QuickBooks Desktop's "no record matched an exact-name filter"
   * signal disguised as a request error, rather than a genuine failure. Callers doing a
   * lookup-then-upsert should treat this as "no existing record," not rethrow it.
   */
  readonly isNotFound: boolean;
  /**
   * True when an update was rejected because its `revisionNumber` is stale — the record changed
   * since the caller last fetched it. Recoverable by re-fetching and retrying once; see
   * `withStaleRevisionRetry` in `client.ts`.
   */
  readonly isStaleRevision: boolean;
  /**
   * True when QuickBooks Desktop itself rejected the request because the record is currently
   * being processed by another in-flight request against the same company file. Recoverable by
   * waiting briefly and retrying the identical request; see `withRecordLockRetry` in `client.ts`.
   */
  readonly isRecordLocked: boolean;

  constructor(rawError: unknown) {
    const { message, code, type, httpStatusCode } = parseConductorError(rawError);
    super(message);
    this.name = 'ConductorApiError';
    this.code = code;
    this.type = type;
    this.httpStatusCode = httpStatusCode;
    this.isTransient = code !== undefined && TRANSIENT_CONDUCTOR_ERROR_CODES.has(code);
    this.isNotFound = code === 'QBD_REQUEST_ERROR' && NOT_FOUND_MESSAGE_PATTERN.test(message);
    this.isStaleRevision = code === 'QBD_REQUEST_ERROR' && STALE_REVISION_MESSAGE_PATTERN.test(message);
    this.isRecordLocked = code === 'QBD_REQUEST_ERROR' && RECORD_LOCKED_MESSAGE_PATTERN.test(message);
  }
}
