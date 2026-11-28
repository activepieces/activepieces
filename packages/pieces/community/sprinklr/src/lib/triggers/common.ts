import { DedupeStrategy, Polling } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, Property, StaticPropsValue } from '@activepieces/pieces-framework';
import { sprinklrAuth } from '../auth';
import { sprinklrCase, SprinklrCaseOutput } from '../common/case';
import { sprinklrClient, SprinklrAuthValue } from '../common/client';
import { sprinklrEndpoints } from '../common/endpoints';

const PAGE_SIZE = 100;
const MAX_CASES_PER_POLL = 500;
const TEST_CASES = 5;
const QUEUE_KEY = 'workflow.queues.queueId';

const QUOTA_NOTE =
  'Each check uses API requests from this key\'s hourly limit.';

function props() {
  return {
    quotaInfo: Property.MarkDown({ value: QUOTA_NOTE }),
    queueId: Property.ShortText({
      displayName: 'Queue ID',
      description: 'Only cases in this queue. Leave empty for every case.',
      required: false,
    }),
  };
}

function searchFilter({ timeKey, since, queueId }: { timeKey: CaseTimeKey; since: number; queueId: string | undefined }): SearchFilter {
  const timeFilter: SearchFilter = { type: 'GT', key: timeKey, values: [since] };
  if (!queueId) {
    return timeFilter;
  }
  return { type: 'AND', filters: [timeFilter, { type: 'IN', key: QUEUE_KEY, values: [queueId] }] };
}

function searchBody({
  timeKey,
  since,
  queueId,
  order,
  size,
}: {
  timeKey: CaseTimeKey;
  since: number;
  queueId: string | undefined;
  order: 'ASC' | 'DESC';
  size: number;
}): Record<string, unknown> {
  return {
    filter: searchFilter({ timeKey, since, queueId }),
    sorts: [{ key: timeKey, order }],
    page: { size },
  };
}

function cleanQueueId(value: unknown): string | undefined {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed.length > 0 ? trimmed : undefined;
}

async function searchCases({
  auth,
  timeKey,
  since,
  queueId,
  order,
  maxResults,
}: {
  auth: SprinklrAuthValue;
  timeKey: CaseTimeKey;
  since: number;
  queueId: string | undefined;
  order: 'ASC' | 'DESC';
  maxResults: number;
}): Promise<{ cases: TimedCase[]; full: boolean }> {
  const { results } = await sprinklrClient.search<unknown>({
    auth,
    entity: sprinklrEndpoints.SEARCH_ENTITY.CASE,
    body: searchBody({ timeKey, since, queueId, order, size: Math.min(PAGE_SIZE, maxResults) }),
    maxResults,
  });
  const direction = order === 'ASC' ? 1 : -1;
  const cases = results
    .map((raw) => sprinklrCase.normalize(raw))
    .map((data) => ({ epochMilliSeconds: data[timeKey] ?? Number.NaN, data }))
    .filter((item) => Number.isFinite(item.epochMilliSeconds))
    .sort((first, second) => direction * (first.epochMilliSeconds - second.epochMilliSeconds));
  return { cases, full: results.length >= maxResults };
}

function withoutLastTimestamp(cases: TimedCase[]): TimedCase[] {
  const last = cases[cases.length - 1]?.epochMilliSeconds;
  const earlier = cases.filter((item) => item.epochMilliSeconds < last);
  return earlier.length > 0 ? earlier : cases;
}

function polling(timeKey: CaseTimeKey): Polling<SprinklrTriggerAuth, SprinklrTriggerProps> {
  return {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
      const { cases, full } = await searchCases({
        auth,
        timeKey,
        since: lastFetchEpochMS,
        queueId: cleanQueueId(propsValue.queueId),
        order: 'ASC',
        maxResults: MAX_CASES_PER_POLL,
      });
      return full ? withoutLastTimestamp(cases) : cases;
    },
  };
}

async function recent({
  auth,
  propsValue,
  timeKey,
}: {
  auth: SprinklrAuthValue;
  propsValue: SprinklrTriggerProps;
  timeKey: CaseTimeKey;
}): Promise<SprinklrCaseOutput[]> {
  const { cases } = await searchCases({
    auth,
    timeKey,
    since: 0,
    queueId: cleanQueueId(propsValue.queueId),
    order: 'DESC',
    maxResults: TEST_CASES,
  });
  return cases.map((item) => item.data);
}

export const sprinklrCaseTrigger = {
  PAGE_SIZE,
  MAX_CASES_PER_POLL,
  TEST_CASES,
  props,
  polling,
  recent,
  searchBody,
};

export type CaseTimeKey = 'createdTime' | 'modifiedTime';

export type SprinklrTriggerAuth = AppConnectionValueForAuthProperty<typeof sprinklrAuth>;

export type SprinklrTriggerProps = StaticPropsValue<ReturnType<typeof props>>;

type TimedCase = { epochMilliSeconds: number; data: SprinklrCaseOutput };

type SearchFilter = { type: string; key?: string; values?: Array<string | number>; filters?: SearchFilter[] };
