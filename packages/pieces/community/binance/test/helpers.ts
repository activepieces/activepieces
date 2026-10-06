import { HttpError } from '@activepieces/pieces-common';
import { vi } from 'vitest';

export const BASE = 'https://data-api.binance.vision/api/v3';

export const sendRequest = vi.fn();

export function ok({ body }: { body: unknown }) {
  sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

export function fail({ status, body = {} }: { status: number; body?: unknown }) {
  sendRequest.mockRejectedValueOnce(new HttpError({}, { status, responseBody: body }));
}

export function request(index = 0) {
  return sendRequest.mock.calls[index][0];
}

export function runAction({ action, props }: { action: { run: unknown }; props: Record<string, unknown> }): Promise<unknown> {
  const run = action.run;
  if (typeof run !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(run, action, [{ propsValue: props }]));
}

export async function errorOf(promise: Promise<unknown>): Promise<Error> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Error) {
      return error;
    }
    throw new Error(`non-Error thrown: ${String(error)}`);
  }
  throw new Error('expected the action to fail');
}
