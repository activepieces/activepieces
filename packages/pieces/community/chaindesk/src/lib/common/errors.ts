function getResponse(error: unknown): { status?: number; body?: unknown } {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return {};
  }
  const response: unknown = error.response;
  if (typeof response !== 'object' || response === null) {
    return {};
  }
  const status =
    'status' in response && typeof response.status === 'number'
      ? response.status
      : undefined;
  const body = 'body' in response ? response.body : undefined;
  return { status, body };
}

function describeBody(body: unknown): string {
  if (body === undefined || body === null || body === '') {
    return 'no response body';
  }
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return text.length > MAX_BODY_LENGTH
    ? `${text.slice(0, MAX_BODY_LENGTH)}...`
    : text;
}

function safeError({
  error,
  readOnly = false,
}: {
  error: unknown;
  readOnly?: boolean;
}): Error {
  const { status, body } = getResponse(error);
  if (status === undefined) {
    return new Error(
      readOnly
        ? 'Askli could not be reached (network error or timeout). Try again.'
        : 'Askli could not be reached (network error or timeout). If this was a create or delete, it may still have been applied; check Askli before retrying.'
    );
  }
  return new Error(`Askli returned HTTP ${status}: ${describeBody(body)}`);
}

async function withNotFoundHint<T>({
  request,
  notFoundMessage,
  resourceName,
  readOnly = false,
  idempotent = true,
}: {
  request: () => Promise<T>;
  notFoundMessage: string;
  resourceName: string;
  readOnly?: boolean;
  idempotent?: boolean;
}): Promise<T> {
  try {
    return await request();
  } catch (error) {
    const { status, body } = getResponse(error);
    const isJsonError =
      typeof body === 'object' && body !== null && 'error' in body;
    if (status === 403 && !isJsonError) {
      throw new Error(BAD_KEY_MESSAGE);
    }
    if (status === 500 && isJsonError && idempotent) {
      throw new Error(
        `Askli returned HTTP 500: the ${resourceName} may not exist, or Askli had a temporary server error. Check the ID and retry.`
      );
    }
    if ((status === 403 || status === 404) && isJsonError) {
      throw new Error(`${notFoundMessage} (Askli returned HTTP ${status}.)`);
    }
    if (status === 404) {
      throw new Error(`${notFoundMessage} (Askli returned HTTP 404.)`);
    }
    throw safeError({ error, readOnly });
  }
}

async function withUsageLimitHint<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    const { status } = getResponse(error);
    if (status === 402) {
      throw new Error(
        'Askli refused the datasource because the account reached its plan usage limit (HTTP 402 USAGE_LIMIT). Delete datasources or upgrade the Askli plan.'
      );
    }
    if (status === 403) {
      throw new Error(
        'Askli rejected the request (HTTP 403). Check the API key and that the datastore belongs to this account.'
      );
    }
    throw safeError({ error });
  }
}

async function withSafeError<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    const { status, body } = getResponse(error);
    const isJsonError =
      typeof body === 'object' && body !== null && 'error' in body;
    if (status === 403 && !isJsonError) {
      throw new Error(BAD_KEY_MESSAGE);
    }
    throw safeError({ error, readOnly: true });
  }
}

const MAX_BODY_LENGTH = 500;
const BAD_KEY_MESSAGE =
  'Askli rejected the API key (HTTP 403). Check or reconnect your Chaindesk (Askli) connection.';

export { withNotFoundHint, withSafeError, withUsageLimitHint };
