import { isNil } from '@activepieces/core-utils';
import {
  ApplicationEventName,
  CreatePlatformEventDestinationRequestBody,
  DestinationType,
  EventDestination,
  EventDestinationHeaders,
  EventDestinationHeadersRequest,
  EventDestinationMapper,
} from '@activepieces/shared';

function toDefaultValues(
  destination: EventDestination | null,
): DestinationFormValues {
  return {
    name: destination?.name ?? '',
    type: destination?.type ?? DestinationType.CUSTOM,
    url: destination?.url ?? '',
    events: destination?.events ?? [],
    headers: toHeaderInputs(destination?.headers),
    mapper: destination?.mapper ?? {},
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

function toMapper(value: unknown): EventDestinationMapper | null {
  const parsed = EventDestinationMapper.safeParse(value);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return null;
  }
  return parsed.data;
}

function toRequest(
  values: DestinationFormValues,
): CreatePlatformEventDestinationRequestBody {
  return {
    name: values.name === '' ? null : values.name,
    type: values.type,
    url: values.url,
    events: values.events,
    headers: toHeaderRequest(values.headers),
    mapper: toMapper(values.mapper),
  };
}

export const destinationFormUtils = {
  toDefaultValues,
  toHeaderRequest,
  toTestHeaders,
  hasBlankHeaderValue,
  toMapper,
  toRequest,
};

export type DestinationFormValues = {
  name: string;
  type: DestinationType;
  url: string;
  events: ApplicationEventName[];
  headers: Record<string, string>;
  mapper: unknown;
};
