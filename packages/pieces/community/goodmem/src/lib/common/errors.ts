export class GoodMemApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ message, status, responseBody }: GoodMemApiErrorParams) {
    super(message);
    this.name = 'GoodMemApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function trimTrailingPunctuation(text: string): string {
  return text.trim().replace(/[\s.!;:,]+$/, '');
}

export function extractVendorMessage(responseBody: unknown): string | null {
  if (typeof responseBody === 'string') {
    const trimmed = responseBody.trim();
    if (trimmed.length === 0) {
      return null;
    }
    if (trimmed.startsWith('{')) {
      try {
        return extractVendorMessage(JSON.parse(trimmed));
      } catch {
        return trimmed.slice(0, 500);
      }
    }
    return trimmed.slice(0, 500);
  }
  if (typeof responseBody !== 'object' || responseBody === null) {
    return null;
  }
  for (const key of ['message', 'error', 'detail', 'title']) {
    const value: unknown = Reflect.get(responseBody, key);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === 'object' && value !== null) {
      const nested = extractVendorMessage(value);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

export function buildGoodMemApiError({
  status,
  responseBody,
  action,
}: {
  status: number;
  responseBody: unknown;
  action: string;
}): GoodMemApiError {
  const vendorMessage = extractVendorMessage(responseBody);
  const hint = statusHint(status);
  const detail = vendorMessage
    ? trimTrailingPunctuation(vendorMessage)
    : hint;
  return new GoodMemApiError({
    message: `GoodMem ${action} failed (HTTP ${status}): ${detail}`,
    status,
    responseBody,
  });
}

export function goodmemValidationMessage(error: unknown): string {
  const status = typeof error === 'object' && error !== null ? Reflect.get(error, 'status') : undefined;
  const message = typeof error === 'object' && error !== null ? Reflect.get(error, 'message') : undefined;
  const text = typeof message === 'string' ? message : 'Unknown error';
  if (status === 401 || status === 403) {
    return `Invalid API key. ${text}`;
  }
  if (status === 0) {
    return `Cannot reach the base URL. ${text}`;
  }
  return text;
}

function statusHint(status: number): string {
  if (status === 401 || status === 403) {
    return 'the API key is invalid or lacks permission';
  }
  if (status === 404) {
    return 'the requested resource was not found';
  }
  if (status === 429) {
    return 'rate limit reached, try again later';
  }
  if (status >= 500) {
    return 'the GoodMem server returned an error';
  }
  return 'the request was rejected';
}

export type GoodMemApiErrorParams = {
  message: string;
  status: number;
  responseBody: unknown;
};
