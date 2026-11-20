import { HttpError } from '@activepieces/pieces-common';
import { isNil, tryCatch } from '@activepieces/core-utils';
import { wavixApiCall } from './client';

export const wavixWebhook = {
  async claim({ request, inUseMessage }: ClaimParams): Promise<void> {
    const { error } = await tryCatch(() => wavixApiCall(request));
    if (isNil(error)) {
      return;
    }
    if (isWebhookInUse(error)) {
      throw new Error(inUseMessage);
    }
    throw error;
  },
  async release({ request, failureMessage }: ReleaseParams): Promise<void> {
    const { error } = await tryCatch(() => wavixApiCall(request));
    if (isNil(error) || isWebhookInUse(error)) {
      return;
    }
    throw new Error(`${failureMessage} (${error.message})`);
  },
};

function isWebhookInUse(error: unknown): boolean {
  return error instanceof HttpError && error.response.status === 409;
}

type WavixRequest = Parameters<typeof wavixApiCall>[0];

type ClaimParams = {
  request: WavixRequest;
  inUseMessage: string;
};

type ReleaseParams = {
  request: WavixRequest;
  failureMessage: string;
};
