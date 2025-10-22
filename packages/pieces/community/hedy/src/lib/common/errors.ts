import { ApiErrorPayload } from './types';

const DEFAULT_ERROR_MESSAGE = 'An unknown error occurred while communicating with Hedy.';

function deriveCode(initialCode: string | undefined, statusCode?: number): string {
  if (initialCode) {
    return initialCode;
  }

  if (statusCode === 429) {
    return 'rate_limit_exceeded';
  }

  return 'unknown_error';
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  webhook_limit_exceeded:
    'Maximum webhook limit (10) reached. Please delete unused webhooks in your Hedy dashboard.',
  authentication_failed:
    'Invalid API key. Please check your Hedy dashboard for the correct API key.',
  invalid_event:
    'Invalid event type. Valid events: session.created, session.ended, highlight.created, todo.exported.',
  invalid_webhook_url:
    'Webhook URL must be publicly accessible. For local testing, use a tunneling service like ngrok.',
  invalid_parameter:
    'Invalid request parameter. Please review your configuration and try again.',
  rate_limit_exceeded:
    'Rate limit reached. Please wait a moment before trying again.',
  unknown_error: DEFAULT_ERROR_MESSAGE,
};

export class HedyApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message || DEFAULT_ERROR_MESSAGE);
    this.name = 'HedyApiError';
  }

  static fromPayload(
    payload: ApiErrorPayload | undefined,
    fallback?: unknown,
    statusCode?: number,
  ): HedyApiError {
    if (payload && payload.error) {
      const { code, message } = payload.error;
      const resolvedCode = deriveCode(code, statusCode);
      return new HedyApiError(
        resolvedCode,
        FRIENDLY_MESSAGES[resolvedCode] ?? message ?? DEFAULT_ERROR_MESSAGE,
        payload,
      );
    }

    if (fallback instanceof HedyApiError) {
      return fallback;
    }

    if (fallback instanceof Error) {
      const derivedCode = deriveCode(undefined, statusCode);
      return new HedyApiError(
        derivedCode,
        FRIENDLY_MESSAGES[derivedCode] ?? fallback.message ?? DEFAULT_ERROR_MESSAGE,
        fallback,
      );
    }

    const finalCode = deriveCode(undefined, statusCode);
    return new HedyApiError(
      finalCode,
      FRIENDLY_MESSAGES[finalCode] ?? DEFAULT_ERROR_MESSAGE,
      fallback,
    );
  }
}
