import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { matomoApi } from '../api';
import { MatomoAuthType, matomoAuth } from '../auth';
import { matomoProps, matomoUtils } from '../common/props';

export const newVisitTrigger = createTrigger({
  auth: matomoAuth,
  name: 'new_visit',
  displayName: 'New Visit',
  classification: 'READ',
  description: 'Triggers when a new visit is recorded on a Matomo site.',
  aiMetadata: {
    description: 'Fires once per new visit recorded on the chosen Matomo site (or the connection site), checked about every 5 minutes. Visits that existed when the trigger was turned on are not replayed. The payload is the visit: idVisit, visitor and device details, referrer, readable first and last action times, and the list of actions (page views, events, goal conversions).',
  },
  type: TriggerStrategy.POLLING,
  props: {
    siteId: matomoProps.siteIdDropdown(),
  },
  sampleData: matomoUtils.toVisit(SAMPLE_VISIT()),
  outputSchema: { fields: matomoUtils.visitFields },
  async onEnable(context) {
    const newest = await fetchPage({
      auth: context.auth.props,
      siteId: context.propsValue.siteId,
      minTimestamp: undefined,
      offset: 0,
      limit: 1,
      sortOrder: 'desc',
    });
    const state: PollState = {
      lastIdVisit: newest.reduce((max, visit) => Math.max(max, visitId(visit) ?? 0), 0),
      lastTimestamp: nowSeconds(),
    };
    await context.store.put(STORE_KEY, state);
  },
  async onDisable(context) {
    await context.store.delete(STORE_KEY);
  },
  async test(context) {
    const visits = await fetchPage({
      auth: context.auth.props,
      siteId: context.propsValue.siteId,
      minTimestamp: undefined,
      offset: 0,
      limit: TEST_LIMIT,
      sortOrder: 'desc',
    });
    return visits.map(matomoUtils.toVisit);
  },
  async run(context) {
    const stored = await context.store.get<PollState>(STORE_KEY);
    const state: PollState = stored ?? { lastIdVisit: 0, lastTimestamp: nowSeconds() };
    const cursor: PollCursor = state.cursor ?? {
      minTimestamp: Math.max(state.lastTimestamp - SAFETY_MARGIN_SECONDS, 0),
      nextOffset: 0,
      emittedIds: [],
      maxIdSeen: state.lastIdVisit,
      startedAt: nowSeconds(),
    };
    const { visits, capped, fetched } = await collectVisits({
      auth: context.auth.props,
      siteId: context.propsValue.siteId,
      minTimestamp: cursor.minTimestamp,
      startOffset: cursor.nextOffset,
    });
    const emitted = new Set(cursor.emittedIds);
    const fresh = visits
      .filter((visit) => {
        const id = visitId(visit) ?? 0;
        return id > state.lastIdVisit && !emitted.has(id);
      })
      .sort((a, b) => (visitId(a) ?? 0) - (visitId(b) ?? 0));
    const unique = [...new Map(fresh.map((visit) => [visitId(visit) ?? 0, visit])).values()];
    const maxIdSeen = unique.reduce((max, visit) => Math.max(max, visitId(visit) ?? 0), cursor.maxIdSeen);
    const nextState: PollState = capped
      ? {
          lastIdVisit: state.lastIdVisit,
          lastTimestamp: state.lastTimestamp,
          cursor: {
            minTimestamp: cursor.minTimestamp,
            nextOffset: cursor.nextOffset + Math.max(fetched - CURSOR_OVERLAP, PAGE_SIZE),
            emittedIds: [...cursor.emittedIds, ...unique.map((visit) => visitId(visit) ?? 0)],
            maxIdSeen,
            startedAt: cursor.startedAt,
          },
        }
      : { lastIdVisit: maxIdSeen, lastTimestamp: cursor.startedAt };
    await context.store.put(STORE_KEY, nextState);
    return unique.map(matomoUtils.toVisit);
  },
});

async function collectVisits({ auth, siteId, minTimestamp, startOffset }: CollectParams) {
  const pages: Record<string, unknown>[][] = [];
  let capped = true;
  for (let page = 0; page < MAX_PAGES; page++) {
    const visits = await fetchPage({ auth, siteId, minTimestamp, offset: startOffset + page * PAGE_SIZE, limit: PAGE_SIZE, sortOrder: 'asc' });
    pages.push(visits);
    if (visits.length < PAGE_SIZE) {
      capped = false;
      break;
    }
  }
  const visits = pages.flat();
  return { visits, capped, fetched: visits.length };
}

async function fetchPage({ auth, siteId, minTimestamp, offset, limit, sortOrder }: FetchPageParams): Promise<Record<string, unknown>[]> {
  const response = await matomoApi.call({
    auth,
    method: 'Live.getLastVisitsDetails',
    idSite: siteId,
    params: {
      minTimestamp,
      filter_limit: limit,
      filter_offset: offset,
      filter_sort_order: sortOrder,
    },
  });
  return matomoApi.toArray(response).filter(matomoApi.isRecord);
}

function visitId(visit: Record<string, unknown>): number | null {
  return matomoUtils.toNumber(visit['idVisit']);
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function SAMPLE_VISIT() {
  return {
    idVisit: '42',
    visitorId: 'a1b2c3d4e5f60718',
    userId: null,
    serverTimestamp: 1763452800,
    serverDate: '2025-11-18',
    firstActionTimestamp: 1763452800,
    lastActionTimestamp: 1763452860,
    visitDuration: 61,
    actions: '2',
    visitCount: '1',
    visitorType: 'new',
    referrerType: 'search',
    referrerName: 'Google',
    referrerUrl: 'https://google.com',
    country: 'Germany',
    city: 'Berlin',
    deviceType: 'Desktop',
    browserName: 'Chrome',
    operatingSystemName: 'Windows',
    actionDetails: [
      { type: 'action', url: 'https://example.com/pricing', pageTitle: 'Pricing', timestamp: 1763452800 },
      { type: 'event', url: 'https://example.com/pricing', eventCategory: 'Signup', eventAction: 'Submit', timestamp: 1763452860 },
    ],
  };
}

const STORE_KEY = 'matomo_new_visit_state';
const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const TEST_LIMIT = 5;
const CURSOR_OVERLAP = 100;
const SAFETY_MARGIN_SECONDS = 4 * 60 * 60;

type PollCursor = { minTimestamp: number; nextOffset: number; emittedIds: number[]; maxIdSeen: number; startedAt: number };

type PollState = { lastIdVisit: number; lastTimestamp: number; cursor?: PollCursor };

type CollectParams = { auth: MatomoAuthType; siteId: string | undefined; minTimestamp: number; startOffset: number };

type FetchPageParams = {
  auth: MatomoAuthType;
  siteId: string | undefined;
  minTimestamp: number | undefined;
  offset: number;
  limit: number;
  sortOrder: 'asc' | 'desc';
};
