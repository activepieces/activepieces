import { ApId, isNil, tryCatchSync } from '@activepieces/core-utils';
import {
  ApplicationEventName,
  CreatePlatformEventDestinationRequestBody,
  EventDestination,
  EventDestinationFormat,
  EventDestinationHeaders,
  EventDestinationHeadersRequest,
  formErrors,
  TestPlatformEventDestinationRequestBody,
} from '@activepieces/shared';
import { z } from 'zod';

import { DestinationKind, destinationKinds } from './destination-kinds';
import { parseFlowIdFromUrl } from './parse-flow-id-from-url';

function toDefaultValues({
  destination,
  kind,
}: {
  destination: EventDestination | null;
  kind: DestinationKind;
}): DestinationFormValues {
  return {
    url: destination?.url ?? '',
    events: inCanonicalOrder(destination?.events ?? []),
    headers: toHeaderRows(destination?.headers),
    format: destination?.format ?? destinationKinds.defaultFormatOf(kind),
  };
}

function inCanonicalOrder(
  events: ApplicationEventName[],
): ApplicationEventName[] {
  return ALL_EVENT_NAMES.filter((event) => events.includes(event));
}

function toHeaderRows(
  headers: EventDestinationHeadersRequest | null | undefined,
): HeaderRow[] {
  if (isNil(headers)) {
    return [];
  }
  return Object.keys(headers)
    .sort((first, second) => first.localeCompare(second))
    .map((name) => ({ name, value: '' }));
}

function toHeaderRequest(rows: HeaderRow[]): EventDestinationHeadersRequest {
  return Object.fromEntries(
    rows
      .filter((row) => row.name !== '')
      .map((row) => [row.name, row.value === '' ? null : row.value]),
  );
}

function toTestHeaders(rows: HeaderRow[]): EventDestinationHeaders {
  return Object.fromEntries(
    rows
      .filter((row) => row.name !== '' && row.value !== '')
      .map((row) => [row.name, row.value]),
  );
}

function hasBlankHeaderValue(rows: HeaderRow[]): boolean {
  return rows.some((row) => row.name !== '' && row.value === '');
}

function findTestHeaderBlocker({
  headers,
  storedHeaderNames,
}: {
  headers: HeaderRow[];
  storedHeaderNames: string[];
}): TestHeaderBlocker | null {
  const issues = findHeaderIssues({
    headers,
    storedHeaderNames,
    isUrlChanged: false,
  });
  if (issues.length > 0) {
    return 'invalidHeader';
  }
  return hasBlankHeaderValue(headers) ? 'blankValue' : null;
}

function toTestRequest({
  url,
  event,
  headers,
  format,
}: {
  url: string;
  event: ApplicationEventName;
  headers: HeaderRow[];
  format: EventDestinationFormat;
}): TestPlatformEventDestinationRequestBody {
  return { url, event, headers: toTestHeaders(headers), format };
}

function isSameTestRequest({
  sent,
  current,
}: {
  sent: TestPlatformEventDestinationRequestBody;
  current: TestPlatformEventDestinationRequestBody;
}): boolean {
  const sentHeaders = sent.headers ?? {};
  const currentHeaders = current.headers ?? {};
  const sentNames = Object.keys(sentHeaders);
  return (
    sent.url === current.url &&
    sent.event === current.event &&
    sent.format === current.format &&
    sentNames.length === Object.keys(currentHeaders).length &&
    sentNames.every((name) => currentHeaders[name] === sentHeaders[name])
  );
}

function findHeaderIssues({
  headers,
  storedHeaderNames,
  isUrlChanged,
}: {
  headers: HeaderRow[];
  storedHeaderNames: string[];
  isUrlChanged: boolean;
}): HeaderIssue[] {
  const storedLowerCaseNames = new Set(
    storedHeaderNames.map((name) => name.toLowerCase()),
  );
  const lowerCaseNames = headers
    .filter((row) => row.name !== '')
    .map((row) => row.name.toLowerCase());
  return headers.flatMap((row, index) => {
    const lowerCaseName = row.name.toLowerCase();
    const nameMessage = findNameIssue({
      row,
      isDuplicate:
        lowerCaseNames.filter((name) => name === lowerCaseName).length > 1,
    });
    const valueMessage = findValueIssue({
      row,
      isStored: storedLowerCaseNames.has(lowerCaseName),
      isUrlChanged,
    });
    const nameIssues: HeaderIssue[] = isNil(nameMessage)
      ? []
      : [{ index, field: 'name', message: nameMessage }];
    const valueIssues: HeaderIssue[] = isNil(valueMessage)
      ? []
      : [{ index, field: 'value', message: valueMessage }];
    return [...nameIssues, ...valueIssues];
  });
}

function buildFormSchema({
  storedHeaderNames,
  storedUrl,
}: {
  storedHeaderNames: string[];
  storedUrl: string | null;
}) {
  return z
    .object({
      url: z
        .string()
        .min(1, 'Endpoint URL is required')
        .pipe(z.url('Invalid URL')),
      events: z
        .array(z.enum(ApplicationEventName))
        .min(1, 'Select at least one event'),
      headers: z.array(z.object({ name: z.string(), value: z.string() })),
      format: z.enum(EventDestinationFormat),
    })
    .superRefine((values, ctx) => {
      findHeaderIssues({
        headers: values.headers,
        storedHeaderNames,
        isUrlChanged: !isNil(storedUrl) && values.url !== storedUrl,
      }).forEach(({ index, field, message }) => {
        ctx.addIssue({
          code: 'custom',
          path: ['headers', index, field],
          message,
        });
      });
    });
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

function resolveOtlpFormat({
  url,
  format,
  isAutoSwitched,
}: OtlpFormatChoice & { url: string }): OtlpFormatChoice {
  const isWebhook = isWebhookUrl(url);
  if (isWebhook && format === EventDestinationFormat.OTLP_PROTOBUF) {
    return { format: EventDestinationFormat.OTLP_JSON, isAutoSwitched: true };
  }
  if (
    !isWebhook &&
    isAutoSwitched &&
    format === EventDestinationFormat.OTLP_JSON
  ) {
    return {
      format: EventDestinationFormat.OTLP_PROTOBUF,
      isAutoSwitched: false,
    };
  }
  return { format, isAutoSwitched: isAutoSwitched && isWebhook };
}

function toHandlerFlowId({
  url,
  webhookPrefixUrl,
}: {
  url: string;
  webhookPrefixUrl: string | null;
}): string | null {
  const parsed = parseFlowIdFromUrl({ url, webhookPrefixUrl });
  if (parsed.kind !== 'flow') {
    return null;
  }
  return ApId.safeParse(parsed.flowId).success ? parsed.flowId : null;
}

function findNameIssue({
  row,
  isDuplicate,
}: {
  row: HeaderRow;
  isDuplicate: boolean;
}): string | null {
  if (row.name === '') {
    return row.value === '' ? null : 'Enter a header name';
  }
  const parsed = EventDestinationHeadersRequest.safeParse({ [row.name]: null });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return issue.code === 'invalid_key'
      ? issue.issues[0]?.message ?? issue.message
      : issue.message;
  }
  return isDuplicate ? formErrors.duplicateHeaderName : null;
}

function findValueIssue({
  row,
  isStored,
  isUrlChanged,
}: {
  row: HeaderRow;
  isStored: boolean;
  isUrlChanged: boolean;
}): string | null {
  if (row.name === '') {
    return null;
  }
  if (row.value !== '') {
    const parsed = EventDestinationHeaders.safeParse({
      [VALUE_CHECK_HEADER_NAME]: row.value,
    });
    return parsed.success ? null : parsed.error.issues[0].message;
  }
  if (!isStored) {
    return 'Enter a value for this header';
  }
  return isUrlChanged ? 'Re-enter this value to change the URL' : null;
}

export const destinationFormUtils = {
  toDefaultValues,
  inCanonicalOrder,
  toHeaderRequest,
  toTestHeaders,
  findTestHeaderBlocker,
  toTestRequest,
  isSameTestRequest,
  findHeaderIssues,
  buildFormSchema,
  toRequest,
  isWebhookUrl,
  toHandlerFlowId,
  resolveOtlpFormat,
};

const WEBHOOK_PATH_MARKER = '/v1/webhooks/';

const VALUE_CHECK_HEADER_NAME = 'X-Value-Check';

const ALL_EVENT_NAMES = Object.values(ApplicationEventName);

export type TestHeaderBlocker = 'blankValue' | 'invalidHeader';

export type OtlpFormatChoice = {
  format: EventDestinationFormat;
  isAutoSwitched: boolean;
};

export type HeaderRow = {
  name: string;
  value: string;
};

export type HeaderIssue = {
  index: number;
  field: 'name' | 'value';
  message: string;
};

export type DestinationFormValues = {
  url: string;
  events: ApplicationEventName[];
  headers: HeaderRow[];
  format: EventDestinationFormat;
};
