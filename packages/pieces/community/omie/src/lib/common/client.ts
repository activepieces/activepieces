import { randomUUID } from 'node:crypto';
import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';

const OMIE_BASE_URL = 'https://app.omie.com.br/api/v1';
const NO_RECORDS_PATTERN = /n[ãa]o existem registros/i;
const END_OF_SECOND_MS = 999;
const TEST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000;

async function call<T = Record<string, unknown>>({
  auth,
  module,
  method,
  param,
}: CallParams): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method: HttpMethod.POST,
      url: `${OMIE_BASE_URL}/${module}/`,
      body: {
        call: method,
        app_key: auth.props.app_key,
        app_secret: auth.props.app_secret,
        param: [param],
      },
    });
    return response.body;
  } catch (error) {
    throw toOmieError({ error });
  }
}

async function listPage<Item>({
  auth,
  endpoint,
  page,
  pageSize,
  filters,
}: ListPageParams): Promise<ListPageResult<Item>> {
  try {
    const response = await call<PageResponse<Item>>({
      auth,
      module: endpoint.module,
      method: endpoint.method,
      param: {
        ...filters,
        [endpoint.pageKey]: page,
        [endpoint.sizeKey]: pageSize,
      },
    });
    const items = response[endpoint.itemsKey];
    const totalPages = response[endpoint.totalPagesKey];
    return {
      items: Array.isArray(items) ? items : [],
      totalPages: typeof totalPages === 'number' ? totalPages : 1,
    };
  } catch (error) {
    if (error instanceof Error && NO_RECORDS_PATTERN.test(error.message)) {
      return { items: [], totalPages: 0 };
    }
    throw error;
  }
}

async function listAll<Item>({
  auth,
  endpoint,
  filters,
  maxPages = Number.POSITIVE_INFINITY,
}: ListAllParams): Promise<Item[]> {
  const first = await listPage<Item>({ auth, endpoint, page: 1, pageSize: 100, filters });
  const lastPage = Math.min(first.totalPages, maxPages);
  const pageNumbers = Array.from({ length: Math.max(lastPage - 1, 0) }, (_, index) => index + 2);
  const rest = await pageNumbers.reduce<Promise<Item[]>>(
    async (previous, page) => [
      ...(await previous),
      ...(await listPage<Item>({ auth, endpoint, page, pageSize: 100, filters })).items,
    ],
    Promise.resolve([]),
  );
  return [...first.items, ...rest];
}

function compact({ value }: { value: Record<string, unknown> }): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== ''),
  );
}

function parseJsonObject({ value }: { value: unknown }): Record<string, unknown> {
  const parsed = typeof value === 'string' && value.trim() !== '' ? JSON.parse(value) : value;
  if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
    return Object.fromEntries(Object.entries(parsed));
  }
  return {};
}

function parseObjectArray({ value }: { value: unknown }): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map((entry) => parseJsonObject({ value: entry })) : [];
}

function toOmieDate({ value }: { value: string }): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function toOmieDateTime({ epochMs }: { epochMs: number }): OmieDateTime {
  const iso = new Date(epochMs - BRASILIA_OFFSET_MS).toISOString();
  const [year, month, day] = iso.slice(0, 10).split('-');
  return { date: `${day}/${month}/${year}`, time: iso.slice(11, 19) };
}

function pollingSince({ lastFetchEpochMS }: { lastFetchEpochMS: number }): OmieDateTime {
  return toOmieDateTime({
    epochMs: lastFetchEpochMS > 0 ? lastFetchEpochMS : Date.now() - TEST_WINDOW_MS,
  });
}

function fromOmieDateTime({ date, time }: { date?: string; time?: string }): number | undefined {
  if (!date) return undefined;
  const [day, month, year] = date.split('/').map(Number);
  const [hours, minutes, seconds] = (time ?? '00:00:00').split(':').map(Number);
  const epochMs = Date.UTC(year, month - 1, day, hours, minutes, seconds) + BRASILIA_OFFSET_MS + END_OF_SECOND_MS;
  return Number.isNaN(epochMs) ? undefined : epochMs;
}

function newIntegrationCode(): string {
  return randomUUID();
}

function toOmieError({ error }: { error: unknown }): unknown {
  if (error instanceof HttpError) {
    const body = error.response.body;
    if (typeof body === 'object' && body !== null && 'faultstring' in body) {
      return new Error(String(body.faultstring));
    }
  }
  return error;
}

export const omieClient = {
  call,
  listPage,
  listAll,
  compact,
  parseJsonObject,
  parseObjectArray,
  toOmieDate,
  toOmieDateTime,
  fromOmieDateTime,
  pollingSince,
  newIntegrationCode,
};

export type OmieAuthValue = {
  props: { app_key: string; app_secret: string };
};

export type OmieDateTime = {
  date: string;
  time: string;
};

export type PagedEndpoint = {
  module: string;
  method: string;
  pageKey: string;
  sizeKey: string;
  totalPagesKey: string;
  itemsKey: string;
};

type CallParams = {
  auth: OmieAuthValue;
  module: string;
  method: string;
  param: Record<string, unknown>;
};

type PageResponse<Item> = Record<string, Item[] | number | undefined>;

type ListPageParams = {
  auth: OmieAuthValue;
  endpoint: PagedEndpoint;
  page: number;
  pageSize: number;
  filters?: Record<string, unknown>;
};

type ListPageResult<Item> = {
  items: Item[];
  totalPages: number;
};

type ListAllParams = {
  auth: OmieAuthValue;
  endpoint: PagedEndpoint;
  filters?: Record<string, unknown>;
  maxPages?: number;
};
