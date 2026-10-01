import { ErrorCode } from '@activepieces/core-utils';
import { t } from 'i18next';

import { api } from '@/lib/api';

function describe(error: unknown): string {
  if (
    api.isApError(
      error,
      ErrorCode.EVENT_DESTINATION_URL_CHANGE_REQUIRES_HEADERS,
    )
  ) {
    return t(
      'Re-enter every saved header value to change the URL. If someone else changed this destination, reload the page first.',
    );
  }
  if (
    api.isApError(
      error,
      ErrorCode.EVENT_DESTINATION_FORMAT_NOT_SUPPORTED_BY_WEBHOOK,
    )
  ) {
    return t(
      'A flow webhook accepts only JSON. Choose the JSON encoding, or send to a webhook instead.',
    );
  }
  return api.serverErrorMessage(error) ?? t('Something went wrong');
}

export const destinationErrors = {
  describe,
};
