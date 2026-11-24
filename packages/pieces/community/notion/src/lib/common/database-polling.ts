import {
  APIErrorCode,
  APIResponseError,
  Client,
  collectPaginatedAPI,
  isFullPage,
} from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import dayjs from 'dayjs';
import { isNil, Store, tryCatch } from '@activepieces/pieces-framework';
import { getNotionToken, NotionAuthValue } from '.';
import { CheckpointItem, notionCheckpoint } from './checkpoint';
import { enrichPage } from './enrich-page';

async function enable({
  auth,
  store,
  databaseId,
  timestamp,
  isRepublish,
}: DatabasePollingParams & { store: Store; isRepublish?: boolean }) {
  await notionCheckpoint.enable({
    store,
    isRepublish,
    fetchLatest: async () => {
      const notion = client(auth);
      const newest = await notion.databases.query({
        database_id: databaseId,
        sorts: [{ timestamp, direction: 'descending' }],
        page_size: 1,
      });
      const latest = newest.results.find(isFullPage);
      if (isNil(latest)) {
        return [];
      }
      const pages = await collectPaginatedAPI(notion.databases.query, {
        database_id: databaseId,
        filter: timestampFilter({
          timestamp,
          bound: dayjs(latest[timestamp]).valueOf(),
        }),
        sorts: [{ timestamp, direction: 'ascending' }],
        page_size: PAGE_SIZE,
      });
      return pages
        .filter(isFullPage)
        .map((page) => toItem({ page, timestamp }));
    },
  });
}

async function poll({
  auth,
  store,
  databaseId,
  timestamp,
}: DatabasePollingParams & { store: Store }): Promise<unknown[]> {
  const checkpoint = await notionCheckpoint.load({ store });
  if (isNil(checkpoint)) {
    await enable({ auth, store, databaseId, timestamp });
    return [];
  }
  const bound = checkpoint.resume?.bound ?? checkpoint.since;
  const { pages, nextCursor } = await readSince({
    notion: client(auth),
    databaseId,
    timestamp,
    bound,
    cursor: checkpoint.resume?.cursor,
  });
  const { fresh, checkpoint: advanced } = notionCheckpoint.advance({
    checkpoint,
    items: pages.map((page) => toItem({ page, timestamp })),
  });
  await notionCheckpoint.save({
    store,
    checkpoint: {
      since: advanced.since,
      seen: advanced.seen,
      ...(isNil(nextCursor) ? {} : { resume: { cursor: nextCursor, bound } }),
    },
  });
  return fresh.reverse().map((item) => item.data);
}

async function sample({
  auth,
  databaseId,
  timestamp,
}: DatabasePollingParams): Promise<unknown[]> {
  const response = await client(auth).databases.query({
    database_id: databaseId,
    sorts: [{ timestamp, direction: 'descending' }],
    page_size: SAMPLE_SIZE,
  });
  return response.results.filter(isFullPage).map((page) => enrichPage(page));
}

async function readSince({
  notion,
  databaseId,
  timestamp,
  bound,
  cursor,
}: {
  notion: Client;
  databaseId: string;
  timestamp: DatabaseTimestamp;
  bound: number;
  cursor: string | undefined;
}): Promise<{ pages: PageObjectResponse[]; nextCursor: string | null }> {
  const query = (startCursor: string | undefined) =>
    notion.databases.query({
      database_id: databaseId,
      filter: timestampFilter({ timestamp, bound }),
      sorts: [{ timestamp, direction: 'ascending' }],
      page_size: PAGE_SIZE,
      start_cursor: startCursor,
    });
  const resumed = await tryCatch(() => query(cursor));
  if (resumed.error && (isNil(cursor) || !isInvalidCursor(resumed.error))) {
    throw resumed.error;
  }
  const firstPage = resumed.data ?? (await query(undefined));
  let pages = firstPage.results.filter(isFullPage);
  let nextCursor = firstPage.has_more ? firstPage.next_cursor : null;
  for (let read = 1; read < MAX_PAGES_PER_POLL && !isNil(nextCursor); read++) {
    const response = await query(nextCursor);
    pages = [...pages, ...response.results.filter(isFullPage)];
    nextCursor = response.has_more ? response.next_cursor : null;
  }
  return { pages, nextCursor };
}

function timestampFilter({
  timestamp,
  bound,
}: {
  timestamp: DatabaseTimestamp;
  bound: number;
}) {
  const on_or_after = dayjs(bound).toISOString();
  return timestamp === 'created_time'
    ? { timestamp, created_time: { on_or_after } }
    : { timestamp, last_edited_time: { on_or_after } };
}

function toItem({
  page,
  timestamp,
}: {
  page: PageObjectResponse;
  timestamp: DatabaseTimestamp;
}): CheckpointItem {
  const id = notionCheckpoint.fingerprint([page.id]);
  return {
    id,
    version:
      timestamp === 'created_time'
        ? id
        : notionCheckpoint.fingerprint([
            page.id,
            page.last_edited_time,
            JSON.stringify(page.properties),
          ]),
    time: dayjs(page[timestamp]).valueOf(),
    data: enrichPage(page),
  };
}

function isInvalidCursor(error: unknown): boolean {
  return (
    APIResponseError.isAPIResponseError(error) &&
    error.code === APIErrorCode.ValidationError
  );
}

function client(auth: NotionAuthValue): Client {
  return new Client({
    auth: getNotionToken(auth),
    notionVersion: '2022-02-22',
  });
}

const PAGE_SIZE = 100;
const SAMPLE_SIZE = 5;
const MAX_PAGES_PER_POLL = 10;

export const notionDatabasePolling = { enable, poll, sample };

type DatabaseTimestamp = 'created_time' | 'last_edited_time';

type DatabasePollingParams = {
  auth: NotionAuthValue;
  databaseId: string;
  timestamp: DatabaseTimestamp;
};
