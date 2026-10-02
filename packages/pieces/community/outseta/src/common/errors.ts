import { HttpError } from '@activepieces/pieces-common';

function isNotFound(error: unknown): boolean {
  return error instanceof HttpError && error.response.status === 404;
}

export const outsetaErrors = { isNotFound };
