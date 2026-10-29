import { Property } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import {
  FlowluApiError,
  FlowluClient,
  FormValue,
  ListEnvelope,
} from './client';

function requireId({ value, name }: { value: unknown; name: string }): number {
  const id = optionalId({ value, name });
  if (id === undefined) {
    throw new FlowluApiError({ message: `${name} is required.` });
  }
  return id;
}

function optionalId({
  value,
  name,
}: {
  value: unknown;
  name: string;
}): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text =
    typeof value === 'number'
      ? String(value)
      : typeof value === 'string'
      ? value.trim()
      : undefined;
  if (text === '') {
    return undefined;
  }
  if (
    text === undefined ||
    !/^\d{1,10}$/.test(text) ||
    Number(text) < 1 ||
    Number(text) > 2147483647
  ) {
    throw new FlowluApiError({
      message: `${name} must be a numeric Flowlu ID such as "42", got ${JSON.stringify(
        value
      )}.`,
    });
  }
  return Number(text);
}

function idList({ value, name }: { value: unknown; name: string }): number[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  const parts = Array.isArray(value)
    ? value
    : typeof value === 'string'
    ? value
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part !== '')
    : [value];
  const ids = parts.map((part) => requireId({ value: part, name }));
  return [...new Set(ids)];
}

function formatDateTime({
  value,
  name,
}: {
  value: unknown;
  name: string;
}): string | undefined {
  return formatWith({ value, name, format: 'YYYY-MM-DD HH:mm:ss' });
}

function formatDate({
  value,
  name,
}: {
  value: unknown;
  name: string;
}): string | undefined {
  return formatWith({ value, name, format: 'YYYY-MM-DD' });
}

function oneOf({
  value,
  name,
  allowed,
}: {
  value: unknown;
  name: string;
  allowed: number[];
}): number | undefined {
  const num = optionalNumber({ value, name });
  if (num !== undefined && !allowed.includes(num)) {
    throw new FlowluApiError({
      message: `${name} must be one of ${allowed.join(
        ', '
      )}, got ${JSON.stringify(value)}.`,
    });
  }
  return num;
}

function triStateFlag(value: unknown): number | undefined {
  if (value === 'yes' || value === true) {
    return 1;
  }
  if (value === 'no' || value === false) {
    return 0;
  }
  return undefined;
}

function optionalNumber({
  value,
  name,
}: {
  value: unknown;
  name: string;
}): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const num =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value.trim())
      : NaN;
  if (!Number.isFinite(num)) {
    throw new FlowluApiError({
      message: `${name} must be a number, got ${JSON.stringify(value)}.`,
    });
  }
  return num;
}

function optionalText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = typeof value === 'string' ? value : String(value);
  return text.trim() === '' ? undefined : text;
}

function pageParams({ page, limit }: { page: unknown; limit: unknown }): {
  page: number;
  limit: number;
} {
  const pageNumber = optionalNumber({ value: page, name: 'Page' }) ?? 1;
  const limitNumber = optionalNumber({ value: limit, name: 'Limit' }) ?? 50;
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw new FlowluApiError({
      message: 'Page must be a whole number of 1 or more.',
    });
  }
  if (!Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 100) {
    throw new FlowluApiError({
      message: 'Limit must be a whole number from 1 to 100.',
    });
  }
  return { page: pageNumber, limit: limitNumber };
}

function orderQuery(order: unknown): Record<string, string> {
  return order === 'oldest'
    ? { 'order_by[asc][]': 'id' }
    : { 'order_by[desc][]': 'id' };
}

function listResult<T>({
  envelope,
  page,
  limit,
}: {
  envelope: ListEnvelope<T>;
  page: number;
  limit: number;
}) {
  const total = Number(
    envelope.total_result ?? envelope.total ?? envelope.items.length
  );
  return {
    items: envelope.items,
    page,
    count: envelope.items.length,
    total,
    has_more: page * limit < total,
  };
}

async function fullRecord({
  client,
  module,
  entity,
  created,
}: {
  client: FlowluClient;
  module: string;
  entity: string;
  created: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const id = requireId({ value: created['id'], name: 'Created record id' });
  try {
    const record = await client.getRecord(module, entity, id);
    return { ...record, read_back_error: null };
  } catch (error) {
    if (!(error instanceof FlowluApiError)) {
      throw error;
    }
    return {
      ...created,
      id,
      read_back_error: `The record was created, but reading it back failed: ${error.message}`,
    };
  }
}

function compact(fields: Record<string, FormValue>): Record<string, FormValue> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  );
}

function formatWith({
  value,
  name,
  format,
}: {
  value: unknown;
  name: string;
  format: string;
}): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new FlowluApiError({
      message: `${name} must be a date such as "2026-10-01T09:30:00Z".`,
    });
  }
  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    throw new FlowluApiError({
      message: `${name} must be a date such as "2026-10-01T09:30:00Z", got ${JSON.stringify(
        value
      )}.`,
    });
  }
  return parsed.format(format);
}

export const flowluInput = {
  requireId,
  optionalId,
  idList,
  formatDateTime,
  formatDate,
  triStateFlag,
  oneOf,
  optionalNumber,
  optionalText,
  pageParams,
  orderQuery,
  compact,
};

export const flowluOutput = {
  listResult,
  fullRecord,
};

export const flowluSharedProps = {
  triState: ({
    displayName,
    description,
  }: {
    displayName: string;
    description: string;
  }) =>
    Property.StaticDropdown({
      displayName,
      description,
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
  page: () =>
    Property.Number({
      displayName: 'Page',
      description:
        'Page of results to return, starting at 1. Use with Limit; check has_more in the output to know if another page exists.',
      required: false,
      defaultValue: 1,
    }),
  limit: () =>
    Property.Number({
      displayName: 'Limit',
      description: 'How many records to return per page, 1 to 100. Default 50.',
      required: false,
      defaultValue: 50,
    }),
  order: () =>
    Property.StaticDropdown({
      displayName: 'Order',
      description: 'Newest first (highest ID first) or oldest first.',
      required: false,
      defaultValue: 'newest',
      options: {
        disabled: false,
        options: [
          { label: 'Newest first', value: 'newest' },
          { label: 'Oldest first', value: 'oldest' },
        ],
      },
    }),
  search: (description: string) =>
    Property.ShortText({
      displayName: 'Search',
      description,
      required: false,
    }),
};

export const flowluFind = {
  run: async ({
    client,
    module,
    entity,
    props,
    filters,
  }: {
    client: FlowluClient;
    module: string;
    entity: string;
    props: Record<string, unknown>;
    filters: Record<string, FormValue>;
  }) => {
    const { page, limit } = pageParams({
      page: props['page'],
      limit: props['limit'],
    });
    const envelope = await client.list(module, entity, {
      ...filters,
      ...orderQuery(props['order']),
      search: optionalText(props['search']),
      page,
      limit,
    });
    return listResult({ envelope, page, limit });
  },
};
