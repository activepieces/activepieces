const TRANSIENT_CONDUCTOR_ERROR_CODES = new Set([
  'QBD_CONNECTION_ERROR',
  'QBD_REQUEST_TIMEOUT',
]);

// QuickBooks Desktop's underlying qbXML query engine raises an error — not an empty result —
// when an exact-match filter (e.g. `fullNames`) matches zero records. Conductor passes that
// through verbatim as a QBD_REQUEST_ERROR. Confirmed live against a real sample company (2026-08-20):
// a nonexistent `fullNames` value 502s with this exact message shape, a match returns 200 normally.
const NOT_FOUND_MESSAGE_PATTERN = /could not be found in QuickBooks/i;

// QuickBooks Desktop's optimistic-concurrency check: an update whose `revisionNumber` no longer
// matches the record's current one (another update landed since the caller's lookup) fails with
// this exact message shape. Confirmed live (2026-08-20): update once, then retry with the
// pre-update revisionNumber -> 502, QBD_REQUEST_ERROR, "revision number (edit sequence) ... is
// out-of-date." Unlike a not-found, this has a well-defined recovery: re-fetch the record and
// retry once with its fresh revisionNumber — see `withStaleRevisionRetry` in `client.ts`.
const STALE_REVISION_MESSAGE_PATTERN = /revision number \(edit sequence\).*is out-of-date/i;

// QuickBooks Desktop itself (not Conductor) processes one qbXML request at a time per company
// file. Two requests touching the same record close together — confirmed live (2026-08-20) by
// running two "Upsert Customer" test-steps against the same customer within seconds of each
// other, through the real engine, not a synthetic test — get this exact rejection on the loser:
// "...because it is already in use. QuickBooks error message: The list element is in use." At
// 85 tenants this is a real, reachable condition (concurrent flow runs, or a human editing the
// same record in QuickBooks Desktop at the moment a sync fires), not an edge case. Unlike a
// stale revision, no new data is needed to recover — the exact same request just needs to wait
// for the lock to clear and retry. See `withRecordLockRetry` in `client.ts`.
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
      // Verbatim userFacingMessage for real QuickBooks Desktop errors (INTEGRATION_ERROR /
      // INTEGRATION_CONNECTION_ERROR) — confirmed live these are accurate and actionable
      // ("Names in this list cannot contain a colon...", "revision number ... is out-of-date").
      // One confirmed exception: INVALID_REQUEST_ERROR (Conductor's own request-shape
      // validation, before it ever reaches QuickBooks) ships a useless generic
      // userFacingMessage ("An internal server error occurred. Please try again.") even though
      // `message` already has the real, specific, safe-to-show reason (a Zod-style validation
      // error naming the field and constraint, e.g. "Too big: expected string to have <=41
      // characters at \"name\""). Confirmed live 2026-08-20 sending a 42-char customer name.
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
