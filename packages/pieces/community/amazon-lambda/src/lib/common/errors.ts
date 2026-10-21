import { HttpError } from '@activepieces/pieces-common';

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
    const name = readString({ value: error, key: 'name' });
    return new LambdaApiError(
      readStatus(error),
      name && name !== 'Error' ? name : 'LambdaError',
      readString({ value: error, key: 'message' }) || 'Unexpected AWS Lambda error',
    );
  }
}

export function parseLambdaErrorBody(body: unknown): { name: string; message: string } {
  if (body && typeof body === 'object') {
    const message = Reflect.get(body, 'Message') ?? Reflect.get(body, 'message');
    const name = Reflect.get(body, '__type') ?? Reflect.get(body, 'Type') ?? Reflect.get(body, 'Code') ?? Reflect.get(body, 'code');
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

function readString({ value, key }: { value: unknown; key: string }): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const field: unknown = Reflect.get(value, key);
  return typeof field === 'string' ? field : undefined;
}

function readStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const metadata: unknown = Reflect.get(error, '$metadata');
  if (typeof metadata !== 'object' || metadata === null) return undefined;
  const status: unknown = Reflect.get(metadata, 'httpStatusCode');
  return typeof status === 'number' ? status : undefined;
}
