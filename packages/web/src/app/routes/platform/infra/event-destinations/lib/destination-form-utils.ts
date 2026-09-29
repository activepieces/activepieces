import { isNil, tryCatchSync } from '@activepieces/core-utils';
import {
  ApplicationEventName,
  CreatePlatformEventDestinationRequestBody,
  EventDestination,
  EventDestinationFormat,
  EventDestinationHeaders,
  EventDestinationHeadersRequest,
} from '@activepieces/shared';

import { DestinationKind, destinationKinds } from './destination-kinds';

function toDefaultValues({
  destination,
  kind,
}: {
  destination: EventDestination | null;
  kind: DestinationKind;
}): DestinationFormValues {
  return {
    url: destination?.url ?? '',
    events: destination?.events ?? [],
    headers: toHeaderInputs(destination?.headers),
    format: destination?.format ?? destinationKinds.defaultFormatOf(kind),
  };
}

function toHeaderInputs(
  headers: EventDestinationHeadersRequest | null | undefined,
): Record<string, string> {
  if (isNil(headers)) {
    return {};
  }
  return Object.fromEntries(Object.keys(headers).map((key) => [key, '']));
}

function toHeaderRequest(
  headers: Record<string, string>,
): EventDestinationHeadersRequest {
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([key]) => key !== '')
      .map(([key, value]) => [key, value === '' ? null : value]),
  );
}

function toTestHeaders(
  headers: Record<string, string>,
): EventDestinationHeaders {
  return Object.fromEntries(
    Object.entries(headers).filter(
      ([key, value]) => key !== '' && value !== '',
    ),
  );
}

function hasBlankHeaderValue(headers: Record<string, string>): boolean {
  return Object.entries(headers).some(
    ([key, value]) => key !== '' && value === '',
  );
}

function toRequest(
  values: DestinationFormValues,
): CreatePlatformEventDestinationRequestBody {
  return {
    url: values.url,
    events: values.events,
    headers: toHeaderRequest(values.headers),
    format: values.format,
  };
}

function isWebhookUrl(url: string): boolean {
  const { data: parsed } = tryCatchSync(() => new URL(url));
  if (isNil(parsed)) {
    return false;
  }
  const markerIndex = parsed.pathname.lastIndexOf(WEBHOOK_PATH_MARKER);
  if (markerIndex === -1) {
    return false;
  }
  const flowId = parsed.pathname
    .slice(markerIndex + WEBHOOK_PATH_MARKER.length)
    .split('/')[0];
  return flowId.length > 0;
}

export const destinationFormUtils = {
  toDefaultValues,
  toHeaderRequest,
  toTestHeaders,
  hasBlankHeaderValue,
  toRequest,
  isWebhookUrl,
};

const WEBHOOK_PATH_MARKER = '/v1/webhooks/';

export type DestinationFormValues = {
  url: string;
  events: ApplicationEventName[];
  headers: Record<string, string>;
  format: EventDestinationFormat;
};
