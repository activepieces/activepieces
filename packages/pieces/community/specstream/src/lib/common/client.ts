import { createHmac, timingSafeEqual } from 'crypto';
import {
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.specstream.ai';
export const WORKSPACE_URL = 'https://specstream.ai/workspace/collections';

export const specstreamApi = { call, statusOf, listLink };
export const specstreamRows = { flatten, latest };
export const specstreamWebhook = { verify };

async function call<T>({
  apiKey,
  method,
  path,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<{ data: T }>({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body.data;
  } catch (e) {
    const status = statusOf(e);
    const message = messageOf(e);
    throw new Error(
      `SpecStream ${status ? `returned HTTP ${status}` : 'could not be reached'}${message ? `: ${message}` : ''}`,
    );
  }
}

function statusOf(e: unknown): number | undefined {
  return e instanceof HttpError ? e.response.status : undefined;
}

function messageOf(e: unknown): string | undefined {
  if (!(e instanceof HttpError)) return undefined;
  const body = e.response.body as { error?: { message?: string } } | undefined;
  return body?.error?.message;
}

function listLink(listId: string): string {
  return `${WORKSPACE_URL}/${encodeURIComponent(listId)}`;
}

type Cell = {
  label?: string;
  column_id?: string;
  display?: unknown;
  value?: unknown;
  provenance?: { source_url?: string; observed_at?: string } | null;
};

export type ListRecord = { entity_id: string; ordinal?: number; cells?: Cell[] };

// One row as flat fields a flow can map: each column's label holds what the list shows,
// plus the page the row's first value was read from and the link to the list.
function flatten(listId: string, record: ListRecord): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: `${listId}:${record.entity_id}`,
    list_id: listId,
    list_link: listLink(listId),
    position: record.ordinal,
  };
  let source: Cell['provenance'] = null;
  for (const cell of record.cells ?? []) {
    const label = String(cell.label ?? cell.column_id ?? '').trim();
    if (!label) continue;
    row[label] = cell.display ?? cell.value ?? '';
    if (!source && cell.provenance?.source_url) source = cell.provenance;
  }
  row['source_url'] = source?.source_url ?? '';
  row['checked_at'] = source?.observed_at ?? '';
  return row;
}

// The newest finished list on the account, so a trigger test shows real rows.
async function latest(apiKey: string, limit = 3): Promise<Record<string, unknown>[]> {
  const specs = await call<{ specs: { spec_id: string }[] }>({
    apiKey,
    method: HttpMethod.GET,
    path: '/v1/specs?limit=10',
  });
  for (const spec of specs.specs ?? []) {
    const history = await call<{ finds: { find_id: string }[] }>({
      apiKey,
      method: HttpMethod.GET,
      path: `/v1/specs/${encodeURIComponent(spec.spec_id)}/finds?limit=5`,
    });
    for (const find of history.finds ?? []) {
      const page = await call<{ find_id: string; rows: ListRecord[] }>({
        apiKey,
        method: HttpMethod.GET,
        path: `/v1/finds/${encodeURIComponent(find.find_id)}/rows`,
      });
      if (page.rows?.length) {
        return page.rows.slice(0, limit).map((record) => flatten(page.find_id, record));
      }
    }
  }
  return [];
}

// SpecStream signs every delivery: header `t=<unix seconds>,v1=<hex HMAC-SHA256 of "t.body">`.
function verify({
  headers,
  rawBody,
  secret,
}: {
  headers: Record<string, string | string[] | undefined>;
  rawBody: unknown;
  secret: string;
}): boolean {
  const header = Object.entries(headers ?? {}).find(
    ([name]) => name.toLowerCase() === 'specstream-signature',
  )?.[1];
  const value = Array.isArray(header) ? header[0] : header;
  const match = /^t=(\d+),v1=([a-f0-9]{64})$/.exec(String(value ?? ''));
  const body =
    typeof rawBody === 'string'
      ? rawBody
      : Buffer.isBuffer(rawBody)
        ? rawBody.toString('utf8')
        : undefined;
  if (!match || !secret || body === undefined) return false;
  if (Math.abs(Date.now() / 1000 - Number(match[1])) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${match[1]}.${body}`).digest();
  const given = Buffer.from(match[2], 'hex');
  return given.length === expected.length && timingSafeEqual(expected, given);
}
