import {
  httpClient,
  HttpRequest,
  HttpResponse,
} from '@activepieces/pieces-common';

export const describeKitError = ({
  status,
  body,
}: {
  status: number;
  body: unknown;
}): string => {
  const detail = typeof body === 'string' ? body : JSON.stringify(body);
  if (status === 401) {
    return `Kit rejected the API Secret (401). Reconnect with the V3 API Secret from Kit Settings > Developer. ${detail}`;
  }
  if (status === 404) {
    return `Kit could not find the requested resource (404). Check the ID. ${detail}`;
  }
  if (status === 422) {
    return `Kit rejected the request (422). ${detail}`;
  }
  if (status === 429) {
    return `Kit rate limit reached (429). Wait a moment and retry. ${detail}`;
  }
  return `Kit API request failed (${status}). ${detail}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const secretsOf = (request: HttpRequest): string[] => {
  const values: unknown[] = [
    isRecord(request.body) ? request.body['api_secret'] : undefined,
    request.queryParams?.['api_secret'],
  ];
  return values.filter(
    (value): value is string => typeof value === 'string' && value.length > 0
  );
};

export const redactKitSecret = ({
  text,
  secrets = [],
}: {
  text: string;
  secrets?: string[];
}): string => {
  let result = text;
  for (const secret of secrets) {
    result = result.split(secret).join('[redacted]');
  }
  return result
    .replace(/("api_secret"\s*:\s*")[^"]*(")/g, '$1[redacted]$2')
    .replace(/(\\"api_secret\\"\s*:\s*\\")[^\\"]*(\\")/g, '$1[redacted]$2')
    .replace(/(api_secret=)[^&\s"]*/g, '$1[redacted]');
};

const responseOf = (
  error: unknown
): { status: number; body: unknown } | undefined => {
  if (!isRecord(error) || !isRecord(error['response'])) {
    return undefined;
  }
  const status = error['response']['status'];
  if (typeof status !== 'number' || status === 0) {
    return undefined;
  }
  return { status, body: error['response']['body'] };
};

const withSecretInQuery = (request: HttpRequest): HttpRequest => {
  if (!isRecord(request.body)) {
    return request;
  }
  const secret = request.body['api_secret'];
  if (typeof secret !== 'string') {
    return request;
  }
  const body = Object.fromEntries(
    Object.entries(request.body).filter(([key]) => key !== 'api_secret')
  );
  return {
    ...request,
    body,
    queryParams: { ...(request.queryParams ?? {}), api_secret: secret },
  };
};

export const kitErrorStatus = (error: unknown): number | undefined => {
  if (!isRecord(error)) {
    return undefined;
  }
  const status = error['status'];
  return typeof status === 'number' ? status : undefined;
};

export const kitHttp = {
  async sendRequest<T>(
    request: HttpRequest
  ): Promise<HttpResponse<T>> {
    try {
      return await httpClient.sendRequest<T>(withSecretInQuery(request));
    } catch (error) {
      const secrets = secretsOf(request);
      const response = responseOf(error);
      if (response) {
        throw Object.assign(
          new Error(redactKitSecret({ text: describeKitError(response), secrets })),
          { status: response.status }
        );
      }
      throw new Error(
        `Kit API request failed: ${
          error instanceof Error
            ? redactKitSecret({ text: error.message, secrets })
            : 'unknown error'
        }`
      );
    }
  },
};
