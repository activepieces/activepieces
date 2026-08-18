import { ErrorCode } from '@activepieces/core-utils';

import { HttpError } from '@/lib/api';

const REJECTION_MESSAGE = 'captchaVerificationFailed';

function isRejection(error: HttpError): boolean {
  const body = error.response?.data as
    | { code?: ErrorCode; params?: { message?: string } }
    | undefined;
  return (
    body?.code === ErrorCode.VALIDATION &&
    body?.params?.message === REJECTION_MESSAGE
  );
}

export const captchaUtils = { isRejection };
