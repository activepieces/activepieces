import {
  DedupeStrategy,
  HttpMethod,
  Polling,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, Store } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from './client';
import { freshsalesProps } from './props';
import { freshsalesRecords, RecordEntity } from './records';

export const freshsalesPolling = {
  buildPolling,
};

const PER_PAGE = 100;
const MAX_PAGES = 10;
const TEST_PER_PAGE = 5;
const VIEW_ID_STORE_PREFIX = 'freshsales_default_view_';

function buildPolling({
  entity,
  timestampField,
}: {
  entity: RecordEntity;
  timestampField: 'created_at' | 'updated_at';
}): Polling<AppConnectionValueForAuthProperty<typeof freshsalesAuth>, Record<string, never>> {
  return {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, store, lastFetchEpochMS }) => {
      const isTest = lastFetchEpochMS === 0;
      const perPage = isTest ? TEST_PER_PAGE : PER_PAGE;
      const viewKey = `${VIEW_ID_STORE_PREFIX}${entity}`;
      const cachedViewId = await store.get<string>(viewKey);
      let viewId = cachedViewId ?? (await lookupViewId({ auth, store, entity, viewKey }));
      let viewRefreshed = cachedViewId === null || cachedViewId === undefined;
      const fetchPage = async (
        page: number
      ): Promise<{ records: Record<string, unknown>[]; totalPages: number | undefined }> => {
        try {
          return await fetchViewPage({ auth, entity, viewId, timestampField, page, perPage });
        } catch (error) {
          if (viewRefreshed || !freshsalesClient.isNotFound(error)) {
            throw error;
          }
          viewRefreshed = true;
          await store.delete(viewKey);
          viewId = await lookupViewId({ auth, store, entity, viewKey });
          return await fetchViewPage({ auth, entity, viewId, timestampField, page, perPage });
        }
      };
      const toItems = (records: Record<string, unknown>[]) =>
        records
          .map((record) => ({ record, epoch: readEpoch({ record, timestampField }) }))
          .filter(({ epoch }) => !Number.isNaN(epoch) && epoch > lastFetchEpochMS)
          .map(({ record, epoch }) => ({
            epochMilliSeconds: epoch,
            data: freshsalesRecords.shapeRecord({ entity, record }),
          }));

      if (isTest) {
        return toItems((await fetchPage(1)).records);
      }

      const collected: PolledItem[] = [];
      let totalPages = 1;
      for (let page = 1; page <= MAX_PAGES; page++) {
        const result = await fetchPage(page);
        totalPages = result.totalPages ?? totalPages;
        collected.push(...toItems(result.records));
        if (
          result.records.length < perPage ||
          reachesCheckpoint({ records: result.records, timestampField, lastFetchEpochMS })
        ) {
          return collected;
        }
      }

      let low = MAX_PAGES + 1;
      let high = Math.max(totalPages, low);
      const pages = new Map<number, Record<string, unknown>[]>();
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const records = (await fetchPage(mid)).records;
        pages.set(mid, records);
        if (
          records.length < perPage ||
          reachesCheckpoint({ records, timestampField, lastFetchEpochMS })
        ) {
          high = mid;
        } else {
          low = mid + 1;
        }
      }

      const oldest: PolledItem[] = [];
      const firstPage = Math.max(1, low - MAX_PAGES + 1);
      for (let page = low; page >= firstPage; page--) {
        const records = pages.get(page) ?? (await fetchPage(page)).records;
        oldest.push(...toItems(records));
      }
      if (oldest.length === 0) {
        return collected;
      }
      const newestEpoch = oldest.reduce(
        (acc, item) => (item.epochMilliSeconds > acc ? item.epochMilliSeconds : acc),
        lastFetchEpochMS
      );
      const complete = oldest.filter((item) => item.epochMilliSeconds < newestEpoch);
      return complete.length > 0 ? complete : oldest;
    },
  };
}

async function lookupViewId({
  auth,
  store,
  entity,
  viewKey,
}: {
  auth: AppConnectionValueForAuthProperty<typeof freshsalesAuth>;
  store: Store;
  entity: RecordEntity;
  viewKey: string;
}): Promise<string> {
  const viewId = await freshsalesProps.findDefaultViewId({ auth, entity });
  await store.put(viewKey, viewId);
  return viewId;
}

async function fetchViewPage({
  auth,
  entity,
  viewId,
  timestampField,
  page,
  perPage,
}: {
  auth: AppConnectionValueForAuthProperty<typeof freshsalesAuth>;
  entity: RecordEntity;
  viewId: string;
  timestampField: 'created_at' | 'updated_at';
  page: number;
  perPage: number;
}): Promise<{ records: Record<string, unknown>[]; totalPages: number | undefined }> {
  const response = await freshsalesClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/api/${entity}/view/${encodeURIComponent(viewId)}`,
    query: {
      page: String(page),
      per_page: String(perPage),
      sort: timestampField,
      sort_type: 'desc',
      include: freshsalesRecords.RECORD_INCLUDES[entity],
    },
  });
  const records = freshsalesClient
    .readArray({ body: response, key: entity })
    .filter((item) => freshsalesClient.isRecord(item));
  const meta = freshsalesClient.readMeta(response);
  const totalPages =
    meta.total_pages ?? (meta.total !== undefined ? Math.ceil(meta.total / perPage) : undefined);
  return { records, totalPages };
}

function readEpoch({
  record,
  timestampField,
}: {
  record: Record<string, unknown>;
  timestampField: 'created_at' | 'updated_at';
}): number {
  return new Date(String(record[timestampField] ?? '')).getTime();
}

function reachesCheckpoint({
  records,
  timestampField,
  lastFetchEpochMS,
}: {
  records: Record<string, unknown>[];
  timestampField: 'created_at' | 'updated_at';
  lastFetchEpochMS: number;
}): boolean {
  return records.some((record) => {
    const epoch = readEpoch({ record, timestampField });
    return !Number.isNaN(epoch) && epoch <= lastFetchEpochMS;
  });
}

type PolledItem = { epochMilliSeconds: number; data: Record<string, unknown> };
