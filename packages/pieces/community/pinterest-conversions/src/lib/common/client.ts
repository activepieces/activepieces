import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.pinterest.com/v5';

async function sendEvents(params: SendEventsParams): Promise<ConversionApiResponse> {
  const { conversionToken, adAccountId, events, test } = params;
  try {
    const response = await httpClient.sendRequest<ConversionApiResponse>({
      method: HttpMethod.POST,
      url: `${BASE_URL}/ad_accounts/${adAccountId}/events`,
      headers: {
        Authorization: `Bearer ${conversionToken}`,
        'Content-Type': 'application/json',
      },
      queryParams: test ? { test: 'true' } : {},
      body: { data: events },
    });
    return response.body;
  } catch (error) {
    throw toFriendlyError(error);
  }
}

function toFriendlyError(error: unknown): Error {
  if (error instanceof HttpError) {
    const status = error.response.status;
    const body = error.response.body as { message?: string; code?: number } | undefined;
    const detail = body?.message ? ` ${body.message}` : '';
    switch (status) {
      case 400:
        return new Error(
          `Bad Request: the conversion event was rejected as invalid.${detail}`
        );
      case 401:
        return new Error(
          'Authentication Failed: the Conversion Access Token is invalid or expired. Generate a new token in Ads Manager and reconnect.'
        );
      case 403:
        return new Error(
          'Access Denied: the token does not have permission for this ad account. Confirm the Ad Account ID and the account role.'
        );
      case 422:
        return new Error(
          `Not all events were processed. Inspect the "events" array in the response for per-event errors.${detail}`
        );
      case 429:
        return new Error(
          "Rate Limit Exceeded: Pinterest allows 5,000 calls per minute per ad account. Please retry shortly."
        );
      case 503:
        return new Error(
          'Service Unavailable: the Pinterest Conversions API is temporarily down. Please try again later.'
        );
      default:
        return new Error(`Pinterest Conversions API Error (${status}).${detail}`);
    }
  }
  return error instanceof Error ? error : new Error('Unexpected error sending conversion event.');
}

export const pinterestConversionsClient = {
  sendEvents,
};

export type ConversionEvent = {
  event_name: string;
  action_source: string;
  event_time: number;
  event_id: string;
  event_source_url?: string;
  opt_out?: boolean;
  partner_name?: string;
  user_data: Record<string, unknown>;
  custom_data?: Record<string, unknown>;
};

export type ConversionApiResponse = {
  num_events_received: number;
  num_events_processed: number;
  events: Array<{
    status: 'processed' | 'failed';
    error_message?: string | null;
    warning_message?: string | null;
  }>;
};

type SendEventsParams = {
  conversionToken: string;
  adAccountId: string;
  events: ConversionEvent[];
  test: boolean;
};
