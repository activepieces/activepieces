import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { GoogleAdsApi } from '../common/client';
import type { GoogleAdsAuthValue, GoogleAdsRow } from '../common/client';
import { absorbEvents, baselineState, createEventsQuery, EVENTS_PER_POLL, eventWindow, planEventsQuery, SEEN_CAP, toCreateEvents } from '../common/change-events';
import type { CreateEventState } from '../common/change-events';
import { customerIdProp } from '../common/props';
import { resourceTypeProp } from '../common/records';
import { newestRecordsQuery, readField, recordsAfterIdQuery, recordsByResourceNamesQuery, resourceDefinition } from '../common/resources';
import type { ResourceDefinition } from '../common/resources';

export async function recordsAfter({ auth, customerId, def, afterId }: RecordsAfterParams): Promise<GoogleAdsRow[]> {
  const { results } = await GoogleAdsApi.searchAll({ auth, customerId, query: recordsAfterIdQuery({ def, afterId }), maxRows: MAX_ROWS_PER_POLL });
  return results;
}

async function saveBaseline({ auth, customerId, resourceType, store }: SaveBaselineParams): Promise<void> {
  const def = resourceDefinition(resourceType);
  if (def.changeEventType) {
    const now = new Date();
    const window = eventWindow(now);
    const query = createEventsQuery({ changeEventType: def.changeEventType, after: window.start, until: window.end, order: 'DESC', limit: SEEN_CAP });
    const { results } = await GoogleAdsApi.searchAll({ auth, customerId, query, maxRows: SEEN_CAP });
    await store.put(EVENTS_KEY, baselineState({ events: toCreateEvents(results), now, limit: SEEN_CAP }));
    return;
  }
  const newest = await newestRecords({ auth, customerId, def, limit: 1 });
  await store.put(LAST_ID_KEY, idOf({ def, row: newest[0] }) ?? '0');
}

async function createdSince({ auth, customerId, def, changeEventType, state, store }: CreatedSinceParams): Promise<GoogleAdsRow[]> {
  const plan = planEventsQuery({ changeEventType, state, now: new Date(), limit: EVENTS_PER_POLL });
  const { results } = await GoogleAdsApi.searchAll({ auth, customerId, query: plan.query, maxRows: EVENTS_PER_POLL });
  const absorbed = absorbEvents({ state: plan.state, events: toCreateEvents(results), full: results.length >= EVENTS_PER_POLL });
  const resourceNames = [...new Set(absorbed.fresh.map((event) => event.resourceName))];
  const rows = await recordsByResourceNames({ auth, customerId, def, resourceNames });
  await store.put(EVENTS_KEY, absorbed.state);
  return rows;
}

async function recordsByResourceNames({ auth, customerId, def, resourceNames }: RecordsByResourceNamesParams): Promise<GoogleAdsRow[]> {
  const rows: GoogleAdsRow[] = [];
  for (let start = 0; start < resourceNames.length; start += NAMES_PER_QUERY) {
    const chunk = resourceNames.slice(start, start + NAMES_PER_QUERY);
    const { results } = await GoogleAdsApi.searchAll({ auth, customerId, query: recordsByResourceNamesQuery({ def, resourceNames: chunk }), maxRows: chunk.length });
    rows.push(...results);
  }
  const byName = new Map(rows.map((row) => [String(readField({ row, gaqlPath: `${def.type}.resource_name` })), row]));
  return resourceNames.flatMap((name) => {
    const row = byName.get(name);
    return row === undefined ? [] : [row];
  });
}

async function newestRecords({ auth, customerId, def, limit }: NewestRecordsParams): Promise<GoogleAdsRow[]> {
  const page = await GoogleAdsApi.search({ auth, customerId, query: newestRecordsQuery({ def, limit }) });
  return page.results ?? [];
}

function idOf({ def, row }: { def: ResourceDefinition; row: GoogleAdsRow | undefined }): string | null {
  if (row === undefined) return null;
  const id = readField({ row, gaqlPath: def.idField });
  return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
}

const LAST_ID_KEY = 'google_ads_new_record_last_id';
const EVENTS_KEY = 'google_ads_new_record_create_events';
const MAX_ROWS_PER_POLL = 1_000;
const NAMES_PER_QUERY = 500;
const TEST_LIMIT = 5;

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
    customerId: customerIdProp,
    resourceType: resourceTypeProp,
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
    await saveBaseline({ auth: context.auth, customerId: context.propsValue.customerId, resourceType: context.propsValue.resourceType, store: context.store });
  },
  async onDisable(context) {
    await context.store.delete(LAST_ID_KEY);
    await context.store.delete(EVENTS_KEY);
  },
  async run(context) {
    const { auth, store } = context;
    const { customerId, resourceType } = context.propsValue;
    const def = resourceDefinition(resourceType);
    if (def.changeEventType) {
      const state = await store.get<CreateEventState>(EVENTS_KEY);
      if (state === null || state === undefined) {
        await saveBaseline({ auth, customerId, resourceType, store });
        return [];
      }
      return createdSince({ auth, customerId, def, changeEventType: def.changeEventType, state, store });
    }
    const lastId = await store.get<string>(LAST_ID_KEY);
    if (lastId === null || lastId === undefined) {
      await saveBaseline({ auth, customerId, resourceType, store });
      return [];
    }
    const rows = await recordsAfter({ auth, customerId, def, afterId: lastId });
    const newestId = idOf({ def, row: rows[rows.length - 1] });
    if (newestId !== null) {
      await store.put(LAST_ID_KEY, newestId);
    }
    return rows;
  },
  async test(context) {
    const def = resourceDefinition(context.propsValue.resourceType);
    return newestRecords({ auth: context.auth, customerId: context.propsValue.customerId, def, limit: TEST_LIMIT });
  },
});

type TriggerStore = { put: <T>(key: string, value: T) => Promise<T> };

type RecordsAfterParams = { auth: GoogleAdsAuthValue; customerId: string; def: ResourceDefinition; afterId: string };

type NewestRecordsParams = { auth: GoogleAdsAuthValue; customerId: string; def: ResourceDefinition; limit: number };

type RecordsByResourceNamesParams = { auth: GoogleAdsAuthValue; customerId: string; def: ResourceDefinition; resourceNames: string[] };

type CreatedSinceParams = {
  auth: GoogleAdsAuthValue;
  customerId: string;
  def: ResourceDefinition;
  changeEventType: string;
  state: CreateEventState;
  store: TriggerStore;
};

type SaveBaselineParams = {
  auth: GoogleAdsAuthValue;
  customerId: string;
  resourceType: string;
  store: TriggerStore;
};
