import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://ads-api.reddit.com/api/v3/pixels';

async function sendEvents(params: SendEventsParams): Promise<ConversionApiResponse> {
  const { conversionToken, pixelId, events, testId } = params;
  try {
    const response = await httpClient.sendRequest<ConversionApiResponse>({
      method: HttpMethod.POST,
      url: `${BASE_URL}/${pixelId}/conversion_events`,
      headers: {
        Authorization: `Bearer ${conversionToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        data: {
          ...(testId ? { test_id: testId } : {}),
          events,
        },
      },
    });
    return response.body;
  } catch (error) {
    throw toFriendlyError(error);
  }
}

function toFriendlyError(error: unknown): Error {
  if (error instanceof HttpError) {
    const status = error.response.status;
    const detail = getErrorDetail(error.response.body);
    const suffix = detail ? ` ${detail}` : '';
    switch (status) {
      case 400:
        return new Error(
          `Bad Request: the conversion event was rejected as invalid. Check the event fields and identifiers.${suffix}`
        );
      case 401:
        return new Error(
          'Authentication Failed: the Conversion Access Token is invalid. Generate a new token in Events Manager (Conversions API) and reconnect.'
        );
      case 403:
        return new Error(
          'Access Denied: the token does not have permission for this pixel. Confirm the Pixel ID and that the token owner can access the ad account.'
        );
      case 404:
        return new Error(
          'Not Found: the Pixel ID was not recognized. Confirm the Pixel ID from Events Manager.'
        );
      case 422:
        return new Error(
          `Unprocessable Event: Reddit could not process the event. Inspect the response for per-field errors.${suffix}`
        );
      case 429:
        return new Error(
          'Rate Limit Exceeded: too many requests to the Reddit Conversions API. Please retry shortly.'
        );
      case 500:
      case 503:
        return new Error(
          'Service Unavailable: the Reddit Conversions API is temporarily unavailable. Please try again later.'
        );
      default:
        return new Error(`Reddit Conversions API Error (${status}).${suffix}`);
    }
  }
  return error instanceof Error ? error : new Error('Unexpected error sending conversion event.');
}

function getErrorDetail(body: unknown): string | undefined {
  if (typeof body === 'string') {
    return body.trim().length > 0 ? body.trim() : undefined;
  }
  if (!isRecord(body)) {
    return undefined;
  }
  const message = body['message'];
  if (typeof message === 'string') {
    return message;
  }
  const error = body['error'];
  if (typeof error === 'string') {
    return error;
  }
  // Reddit's documented error shape is { error: { code, message, fields?: [{ field, message }] } }.
  if (isRecord(error)) {
    const nested = typeof error['message'] === 'string' ? error['message'] : undefined;
    const fields = describeErrorFields(error['fields']);
    const combined = [nested, fields].filter(notEmpty).join(' ');
    if (combined.length > 0) {
      return combined;
    }
  }
  // Fall back to the raw body so an unrecognized shape isn't silently swallowed.
  const serialized = safeStringify(body);
  return serialized ? serialized.slice(0, 500) : undefined;
}

function describeErrorFields(fields: unknown): string | undefined {
  if (!Array.isArray(fields) || fields.length === 0) {
    return undefined;
  }
  const parts = fields
    .filter(isRecord)
    .map((entry) => {
      const field = typeof entry['field'] === 'string' ? entry['field'] : undefined;
      const message = typeof entry['message'] === 'string' ? entry['message'] : undefined;
      if (field && message) {
        return `${field}: ${message}`;
      }
      return field ?? message;
    })
    .filter(notEmpty);
  return parts.length > 0 ? `(${parts.join('; ')})` : undefined;
}

function notEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.length > 0;
}

function safeStringify(value: unknown): string | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const redditConversionsClient = {
  sendEvents,
};

export type ConversionEvent = {
  event_at: number;
  action_source: string;
  type: {
    tracking_type: string;
    custom_event_name?: string;
  };
  event_source_url?: string;
  click_id?: string;
  user: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type ConversionApiResponse = {
  data?: {
    message?: string;
  };
};

type SendEventsParams = {
  conversionToken: string;
  pixelId: string;
  events: ConversionEvent[];
  testId?: string;
};
