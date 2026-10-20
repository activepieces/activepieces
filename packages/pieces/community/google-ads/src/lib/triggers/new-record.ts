import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { googleAdsApi } from '../common/api';
import { googleAdsProps } from '../common/props';
import type { GoogleAdsAuthValue, GoogleAdsResourceDefinition, GoogleAdsRow } from '../common/types';
import { googleAdsUtils } from '../common/utils';

const LAST_ID_KEY = 'google_ads_new_record_last_id';
const EVENTS_KEY = 'google_ads_new_record_create_events';
const TEST_LIMIT = 5;
const EVENTS_PER_POLL = 10_000;
const OVERLAP_MS = 10 * 60_000;
const DAY_MS = 86_400_000;

export const newRecord = createTrigger({
  name: 'newRecord',
  classification: 'READ',
  displayName: 'New Record',
  description: 'Fires when a campaign, ad group, ad, keyword or audience list is created in the selected account (removed records are ignored)',
  aiMetadata: {
    description:
      'Fires once per newly created record of the chosen type (campaign, ad group, ad, keyword or audience list) in one Google Ads account. Campaigns, ad groups and audience lists are detected by polling for ids above the last one seen; ads and keywords are detected from the account change history (creations from the last 30 days) because their ids repeat across ad groups. Each payload is one GAQL row nested under the resource (for example campaign.id); removed records and updates do not fire.',
  },
  auth: googleAdsAuth,
  props: {
    customerId: googleAdsProps.customerId({ required: true }),
    resourceType: googleAdsProps.resourceType({ required: true }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    campaign: {
      resourceName: 'customers/1234567890/campaigns/123456789',
      id: '123456789',
      name: 'Spring sale',
      status: 'ENABLED',
      advertisingChannelType: 'SEARCH',
      biddingStrategyType: 'MANUAL_CPC',
      campaignBudget: 'customers/1234567890/campaignBudgets/1122334455',
      startDateTime: '2026-09-01 00:00:00',
      endDateTime: '2037-12-30 23:59:59',
    },
  },
  async onEnable(context) {
    const { customerId, resourceType } = context.propsValue;
    await saveBaseline({ auth: context.auth, customerId, def: googleAdsUtils.resourceDefinition(resourceType), store: context.store });
  },
  async onDisable(context) {
    await context.store.delete(LAST_ID_KEY);
    await context.store.delete(EVENTS_KEY);
  },
  async run(context) {
    const { auth, store } = context;
    const { customerId } = context.propsValue;
    const def = googleAdsUtils.resourceDefinition(context.propsValue.resourceType);
    if (def.changeEventType) {
      const state = await store.get<EventState>(EVENTS_KEY);
      if (!state) {
        await saveBaseline({ auth, customerId, def, store });
        return [];
      }
      const now = new Date();
      const events = await googleAdsApi.listCreateEvents({
        auth,
        customerId,
        changeEventType: def.changeEventType,
        after: latest([windowStart(now), state.full ? state.cursor : shift({ time: state.cursor, ms: -OVERLAP_MS })]),
        until: windowEnd(now),
        order: 'ASC',
        limit: EVENTS_PER_POLL,
      });
      const fresh = events.filter((row) => !isSeen({ state, row }));
      await store.put<EventState>(EVENTS_KEY, absorb({ state, events, full: events.length >= EVENTS_PER_POLL }));
      return await createdRecords({ auth, customerId, def, events: fresh });
    }
    const lastId = await store.get<string>(LAST_ID_KEY);
    if (lastId === null || lastId === undefined) {
      await saveBaseline({ auth, customerId, def, store });
      return [];
    }
    const rows = await googleAdsApi.listRecordsAfterId({ auth, customerId, def, afterId: lastId });
    const newestId = def.read(rows[rows.length - 1] ?? {})?.id;
    if (newestId) {
      await store.put(LAST_ID_KEY, String(newestId));
    }
    return rows;
  },
  async test(context) {
    const def = googleAdsUtils.resourceDefinition(context.propsValue.resourceType);
    return await googleAdsApi.listNewestRecords({ auth: context.auth, customerId: context.propsValue.customerId, def, limit: TEST_LIMIT });
  },
});

async function saveBaseline({ auth, customerId, def, store }: SaveBaselineParams): Promise<void> {
  if (def.changeEventType) {
    const now = new Date();
    const events = await googleAdsApi.listCreateEvents({
      auth,
      customerId,
      changeEventType: def.changeEventType,
      after: windowStart(now),
      until: windowEnd(now),
      order: 'DESC',
      limit: EVENTS_PER_POLL,
    });
    await store.put<EventState>(EVENTS_KEY, absorb({ state: { cursor: windowStart(now), seen: {} }, events, full: false }));
    return;
  }
  const newest = await googleAdsApi.listNewestRecords({ auth, customerId, def, limit: 1 });
  await store.put(LAST_ID_KEY, String(def.read(newest[0] ?? {})?.id ?? '0'));
}

async function createdRecords({ auth, customerId, def, events }: CreatedRecordsParams): Promise<GoogleAdsRow[]> {
  const prefix = `customers/${googleAdsUtils.normalizeCustomerId(customerId)}/${def.collection}/`;
  const names = [...new Set(events.map((row) => row.changeEvent?.changeResourceName ?? '').filter((name) => name.startsWith(prefix)))];
  const rows = await googleAdsApi.listRecordsByResourceNames({ auth, customerId, def, resourceNames: names });
  const byName = new Map(rows.map((row) => [def.read(row)?.resourceName, row]));
  return names.flatMap((name) => {
    const row = byName.get(name);
    const entity = row === undefined ? undefined : def.read(row);
    if (row === undefined || entity?.status === 'REMOVED' || (def.kind !== undefined && entity?.type !== def.kind.value)) {
      return [];
    }
    return [row];
  });
}

function absorb({ state, events, full }: { state: EventState; events: GoogleAdsRow[]; full: boolean }): EventState {
  const cursor = latest([state.cursor, ...events.map((row) => secondOf(row.changeEvent?.changeDateTime ?? state.cursor))]);
  const keep = shift({ time: cursor, ms: -OVERLAP_MS });
  const seen = events.reduce<Record<string, string>>(
    (groups, row) => {
      const second = secondOf(row.changeEvent?.changeDateTime ?? '');
      return second < keep || isSeen({ state: { cursor, seen: groups }, row }) ? groups : { ...groups, [second]: `${groups[second] ?? ''}${seenKey(row)}` };
    },
    Object.fromEntries(Object.entries(state.seen).filter(([second]) => second >= keep))
  );
  return { cursor, seen, ...(full ? { full } : {}) };
}

function isSeen({ state, row }: { state: EventState; row: GoogleAdsRow }): boolean {
  const keys = state.seen[secondOf(row.changeEvent?.changeDateTime ?? '')] ?? '';
  const key = seenKey(row);
  return Array.from({ length: keys.length / SEEN_KEY_LENGTH }, (_, i) => keys.slice(i * SEEN_KEY_LENGTH, (i + 1) * SEEN_KEY_LENGTH)).includes(key);
}

function seenKey(row: GoogleAdsRow): string {
  return googleAdsUtils.sha256(row.changeEvent?.resourceName ?? '').slice(0, SEEN_KEY_LENGTH);
}

function secondOf(time: string): string {
  return time.slice(0, 19);
}

function shift({ time, ms }: { time: string; ms: number }): string {
  const [date, clock = '00:00:00'] = time.split(' ');
  return formatTime(new Date(Date.parse(`${date}T${clock.slice(0, 8)}Z`) + ms));
}

function windowStart(now: Date): string {
  return formatTime(new Date(now.getTime() - 29 * DAY_MS)).slice(0, 10);
}

function windowEnd(now: Date): string {
  return formatTime(new Date(now.getTime() + 2 * DAY_MS)).slice(0, 10);
}

function formatTime(date: Date): string {
  const iso = date.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)}`;
}

function latest(times: string[]): string {
  return times.reduce((max, time) => (time > max ? time : max));
}

const SEEN_KEY_LENGTH = 8;

type EventState = { cursor: string; seen: Record<string, string>; full?: boolean };

type SaveBaselineParams = {
  auth: GoogleAdsAuthValue;
  customerId: string;
  def: GoogleAdsResourceDefinition;
  store: { put: <T>(key: string, value: T) => Promise<T> };
};

type CreatedRecordsParams = { auth: GoogleAdsAuthValue; customerId: string; def: GoogleAdsResourceDefinition; events: GoogleAdsRow[] };
