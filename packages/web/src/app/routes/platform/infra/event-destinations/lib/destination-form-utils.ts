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

function findHeaderIssues({
  headers,
  storedHeaderNames,
  isUrlChanged,
}: {
  headers: Record<string, string>;
  storedHeaderNames: string[];
  isUrlChanged: boolean;
}): string[] {
  const storedLowerCaseNames = new Set(
    storedHeaderNames.map((name) => name.toLowerCase()),
  );
  const blankValueNames = Object.entries(headers)
    .filter(([name, value]) => name !== '' && value === '')
    .map(([name]) => name);
  const isStored = (name: string) =>
    storedLowerCaseNames.has(name.toLowerCase());
  const hasNamelessValue = (headers[''] ?? '') !== '';
  const hasBlankAddedValue = blankValueNames.some((name) => !isStored(name));
  const hasCarriedOverValue = blankValueNames.some(isStored);
  const parsed = EventDestinationHeadersRequest.safeParse(
    toHeaderRequest(headers),
  );
  const schemaMessages = parsed.success
    ? []
    : parsed.error.issues.map((issue) =>
        issue.code === 'invalid_key'
          ? issue.issues[0]?.message ?? issue.message
          : issue.message,
      );
  return [
    ...schemaMessages,
    ...(hasNamelessValue ? ['Enter a name for every header'] : []),
    ...(hasBlankAddedValue ? ['Enter a value for every header you add'] : []),
    ...(isUrlChanged && hasCarriedOverValue
      ? ['Re-enter every header value to change the URL']
      : []),
  ];
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
  findHeaderIssues,
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
