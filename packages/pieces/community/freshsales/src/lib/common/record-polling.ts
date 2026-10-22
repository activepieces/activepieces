import {
  DedupeStrategy,
  HttpMethod,
  Polling,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
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

function buildPolling({
  entity,
  timestampField,
}: {
  entity: RecordEntity;
  timestampField: 'created_at' | 'updated_at';
}): Polling<AppConnectionValueForAuthProperty<typeof freshsalesAuth>, Record<string, never>> {
  return {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
      const viewId = await freshsalesProps.findDefaultViewId({ auth, entity });
      const isTest = lastFetchEpochMS === 0;
      const perPage = isTest ? TEST_PER_PAGE : PER_PAGE;
      const maxPages = isTest ? 1 : MAX_PAGES;
      const collected: { epochMilliSeconds: number; data: Record<string, unknown> }[] = [];
      for (let page = 1; page <= maxPages; page++) {
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
        let reachedCheckpoint = false;
        for (const record of records) {
          const epoch = new Date(String(record[timestampField] ?? '')).getTime();
          if (Number.isNaN(epoch)) {
            continue;
          }
          if (epoch <= lastFetchEpochMS) {
            reachedCheckpoint = true;
            break;
          }
          collected.push({
            epochMilliSeconds: epoch,
            data: freshsalesRecords.shapeRecord({ entity, record }),
          });
        }
        if (reachedCheckpoint || records.length < perPage) {
          break;
        }
      }
      return collected;
    },
  };
}

