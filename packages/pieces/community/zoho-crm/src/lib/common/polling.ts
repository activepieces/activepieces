import { HttpMethod } from '@activepieces/pieces-common';
import { Store } from '@activepieces/pieces-framework';
import { ZohoAuth, ZohoCrmError, ZohoListResponse, zohoRequestRaw } from './client';

export const CURSOR_KEY = 'zoho_poll_cursor';

export async function collectSince({
  cursor,
  fetchPage,
  timeField,
  maxPages = MAX_POLL_PAGES,
  maxMarkIds = MAX_MARK_IDS,
}: {
  cursor: PollCursor;
  fetchPage: PageFetcher;
  timeField: string;
  maxPages?: number;
  maxMarkIds?: number;
}): Promise<{ records: ZohoRecord[]; cursor: PollCursor; truncated: boolean }> {
  const backlog = cursor.backlog;
  const seenAtCheckpoint = new Set(cursor.ids);
  const floorIds = new Set(backlog?.floor.ids ?? []);
  const fresh = new Map<string, ZohoRecord>();
  let pageToken = backlog?.pageToken;
  let reachedCheckpoint = false;
  let capturedAt: number | undefined;
  for (let page = 0; page < maxPages && !reachedCheckpoint; page++) {
    const result = page === 0 ? await fetchFirstPage({ fetchPage, pageToken }) : await fetchPage({ pageToken });
    capturedAt = capturedAt ?? result.serverTime;
    for (const record of result.records) {
      const time = recordTime({ record, timeField });
      const id = String(record.id ?? '');
      if (time < cursor.time) {
        reachedCheckpoint = true;
        break;
      }
      const alreadyEmitted =
        (time === cursor.time && seenAtCheckpoint.has(id)) ||
        (backlog !== undefined && (time > backlog.floor.time || (time === backlog.floor.time && floorIds.has(id))));
      if (!alreadyEmitted && !fresh.has(id)) {
        fresh.set(id, record);
      }
    }
    if (!result.more) {
      reachedCheckpoint = true;
    }
    if (!reachedCheckpoint) {
      if (!result.nextPageToken) {
        throw new ZohoCrmError('Zoho CRM reported more records but sent no next_page_token, so the trigger cannot page back to its last check. It will retry on the next poll.');
      }
      pageToken = result.nextPageToken;
    }
  }
  const records = [...fresh.values()].sort((a, b) => recordTime({ record: a, timeField }) - recordTime({ record: b, timeField }));
  return {
    records,
    cursor: nextCursor({ cursor, records, timeField, truncated: !reachedCheckpoint, pageToken, maxMarkIds, capturedAt }),
    truncated: !reachedCheckpoint,
  };
}

export function modulePageFetcher({
  auth,
  module,
  fields,
  sortBy,
  apiVersion,
}: {
  auth: ZohoAuth;
  module: string;
  fields: string[];
  sortBy: 'Created_Time' | 'Modified_Time';
  apiVersion?: string;
}): PageFetcher {
  return async ({ pageToken }) => {
    const { status, body, headers } = await zohoRequestRaw<ZohoListResponse<ZohoRecord>>({
      auth,
      version: apiVersion,
      method: HttpMethod.GET,
      path: `/${encodeURIComponent(module)}`,
      query: {
        fields: fields.join(','),
        sort_by: sortBy,
        sort_order: 'desc',
        per_page: '200',
        ...(pageToken ? { page_token: pageToken } : { page: '1' }),
      },
    });
    const list = status === 204 ? undefined : body;
    return {
      records: list?.data ?? [],
      more: list?.info?.more_records === true,
      nextPageToken: list?.info?.next_page_token ?? undefined,
      serverTime: serverTimeOf(headers),
    };
  };
}

export async function zohoNow({ auth, module }: { auth: ZohoAuth; module: string }): Promise<number> {
  const { headers } = await zohoRequestRaw<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/${encodeURIComponent(module)}`,
    query: { fields: 'id', per_page: '1' },
  });
  return serverTimeOf(headers) ?? Date.now();
}

export async function initCursor({ store, isRepublish, now }: { store: Store; isRepublish?: boolean; now: () => Promise<number> }): Promise<void> {
  if (isRepublish && (await store.get<PollCursor>(CURSOR_KEY))) {
    return;
  }
  await store.put<PollCursor>(CURSOR_KEY, startCursor(await now()));
}

export function startCursor(now: number): PollCursor {
  return { time: Math.floor(now / 1000) * 1000, ids: [] };
}

const MAX_POLL_PAGES = 25;
const MAX_MARK_IDS = 5000;

function recordTime({ record, timeField }: { record: ZohoRecord; timeField: string }): number {
  const raw = record[timeField];
  const t = typeof raw === 'string' ? Date.parse(raw) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

async function fetchFirstPage({ fetchPage, pageToken }: { fetchPage: PageFetcher; pageToken?: string }): Promise<PageResult> {
  if (pageToken === undefined) {
    return fetchPage({});
  }
  try {
    return await fetchPage({ pageToken });
  } catch (error) {
    if (error instanceof ZohoCrmError && error.status === 400) {
      return fetchPage({});
    }
    throw error;
  }
}

function idsAt({ records, time, timeField }: { records: ZohoRecord[]; time: number; timeField: string }): string[] {
  return records.filter((r) => recordTime({ record: r, timeField }) === time).map((r) => String(r.id ?? ''));
}

function nextCursor({
  cursor,
  records,
  timeField,
  truncated,
  pageToken,
  maxMarkIds,
  capturedAt,
}: {
  cursor: PollCursor;
  records: ZohoRecord[];
  timeField: string;
  truncated: boolean;
  pageToken?: string;
  maxMarkIds: number;
  capturedAt?: number;
}): PollCursor {
  const backlog = cursor.backlog;
  const newest = records.length > 0 ? recordTime({ record: records[records.length - 1], timeField }) : undefined;
  const oldest = records.length > 0 ? recordTime({ record: records[0], timeField }) : undefined;
  const head: PollMark =
    newest === undefined
      ? { time: cursor.time, ids: cursor.ids }
      : {
          time: newest,
          ids: newest === cursor.time ? [...cursor.ids, ...idsAt({ records, time: newest, timeField })] : idsAt({ records, time: newest, timeField }),
          ...(capturedAt !== undefined ? { capturedAt } : {}),
        };
  if (truncated && pageToken) {
    const top = backlog?.top ?? settleMark({ mark: head, maxMarkIds });
    const floorIds =
      oldest === undefined
        ? backlog?.floor.ids ?? top.ids
        : [...(backlog?.floor.time === oldest ? backlog.floor.ids : []), ...idsAt({ records, time: oldest, timeField })];
    const floor: PollMark = { time: oldest ?? backlog?.floor.time ?? top.time, ids: floorIds.slice(-maxMarkIds) };
    return { time: cursor.time, ids: cursor.ids, backlog: { pageToken, top, floor } };
  }
  if (backlog) {
    const atTop = [
      ...backlog.top.ids,
      ...(backlog.floor.time === backlog.top.time ? backlog.floor.ids : []),
      ...idsAt({ records, time: backlog.top.time, timeField }),
    ];
    return settleMark({ mark: { ...backlog.top, ids: [...new Set(atTop)] }, maxMarkIds });
  }
  return newest === undefined ? cursor : settleMark({ mark: head, maxMarkIds });
}

function settleMark({ mark, maxMarkIds }: { mark: PollMark; maxMarkIds: number }): PollMark {
  if (mark.ids.length <= maxMarkIds) {
    return mark;
  }
  if (mark.capturedAt !== undefined && mark.time + 1000 <= mark.capturedAt) {
    return { time: mark.time + 1000, ids: [] };
  }
  return { ...mark, ids: mark.ids.slice(-maxMarkIds) };
}

function serverTimeOf(headers: Record<string, unknown>): number | undefined {
  const value = headers['date'];
  const raw = Array.isArray(value) ? value[0] : value;
  const time = typeof raw === 'string' ? Date.parse(raw) : NaN;
  return Number.isNaN(time) ? undefined : time;
}

type PollMark = { time: number; ids: string[]; capturedAt?: number };

type PageResult = { records: ZohoRecord[]; more: boolean; nextPageToken?: string; serverTime?: number };

export type ZohoRecord = Record<string, unknown> & { id?: string };

export type PollCursor = PollMark & { backlog?: { pageToken: string; top: PollMark; floor: PollMark } };

export type PageFetcher = (request: { pageToken?: string }) => Promise<PageResult>;
