import { HttpError } from '@activepieces/pieces-common';

// NOTE: HttpError.message is the request body, so the step log would hide the AWS response.
export class LambdaApiError extends Error {
  constructor(
    readonly status: number | undefined,
    name: string,
    detail: string,
  ) {
    super(status === undefined ? `${name}: ${detail}` : `AWS Lambda API returned ${status} (${name}): ${detail}`);
    this.name = name;
  }

  static from(error: unknown): LambdaApiError {
    if (error instanceof LambdaApiError) return error;
    if (error instanceof HttpError) {
      const { status, body } = error.response;
      const parsed = parseLambdaErrorBody(body);
      return new LambdaApiError(status, parsed.name, parsed.message);
    }
    const err = error as { name?: string; message?: string };
    return new LambdaApiError(
      undefined,
      err.name && err.name !== 'Error' ? err.name : 'LambdaError',
      err.message || 'Unexpected AWS Lambda error',
    );
  }
}

export function parseLambdaErrorBody(body: unknown): { name: string; message: string } {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const message = record['Message'] ?? record['message'];
    const name = record['__type'] ?? record['Type'] ?? record['Code'] ?? record['code'];
    return {
      name: typeof name === 'string' && name ? name : 'LambdaError',
      message: typeof message === 'string' && message ? message : JSON.stringify(body),
    };
  }
  return {
    name: 'LambdaError',
    message: typeof body === 'string' && body ? body : JSON.stringify(body ?? null),
  };
}
