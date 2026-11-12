import { ErrorCode } from '@activepieces/core-utils';
import { EventDestinationTestError } from '@activepieces/shared';
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

function describeTestError({
  code,
  isCloud,
}: {
  code: EventDestinationTestError;
  isCloud: boolean;
}): string {
  switch (code) {
    case EventDestinationTestError.BLOCKED:
      return isCloud
        ? t(
            'This URL points to a private or internal address, so the test was not sent.',
          )
        : t(
            'This URL points to a private or internal address, so the test was not sent. To allow it, add the address to AP_SSRF_ALLOW_LIST on the server and restart the server.',
          );
    case EventDestinationTestError.TIMEOUT:
      return t('The destination did not answer in time.');
    case EventDestinationTestError.TLS:
      return t(
        'The secure connection failed. Check the TLS certificate of the destination.',
      );
    case EventDestinationTestError.CONNECTION_FAILED:
      return t('Could not connect to the destination. Check the URL.');
    case EventDestinationTestError.HANDLER_FLOW_FAILED:
      return t('The handler flow could not take the event.');
  }
}

export const destinationErrors = {
  describe,
  describeTestError,
};
