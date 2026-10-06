import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { GoogleAdsApi, normalizeCustomerId } from '../common/client';
import type { GoogleAdsAuthValue, GoogleAdsRow } from '../common/client';
import { absorbEvents, accountTime, baselineState, beforeActivation, createEventsQuery, EVENTS_PER_POLL, eventWindow, freshEvents, planEventsQuery, toCreateEvents } from '../common/change-events';
import type { CreateEvent, CreateEventState, PendingRecord } from '../common/change-events';
import { customerIdProp } from '../common/props';
import { resourceTypeProp } from '../common/records';
import { isOfKind, newestRecordsQuery, readField, recordsAfterIdQuery, recordsByResourceNamesQuery, resourceDefinition } from '../common/resources';
import type { ResourceDefinition } from '../common/resources';

export async function recordsAfter({ auth, customerId, def, afterId }: RecordsAfterParams): Promise<GoogleAdsRow[]> {
  const { results } = await GoogleAdsApi.searchAll({ auth, customerId, query: recordsAfterIdQuery({ def, afterId }), maxRows: MAX_ROWS_PER_POLL });
  return results;
}

async function saveBaseline({ auth, customerId, resourceType, store }: SaveBaselineParams): Promise<void> {
  const def = resourceDefinition(resourceType);
  if (def.changeEventType) {
    const now = new Date();
    const enabledAt = accountTime({ now, timeZone: await accountTimeZone({ auth, customerId }) });
    const window = eventWindow(now);
    const query = createEventsQuery({ changeEventType: def.changeEventType, after: window.start, until: window.end, order: 'DESC', limit: BASELINE_EVENTS });
    const { results } = await GoogleAdsApi.searchAll({ auth, customerId, query, maxRows: BASELINE_EVENTS });
    await store.put(EVENTS_KEY, baselineState({ events: toCreateEvents(results), now, limit: BASELINE_EVENTS, enabledAt }));
    return;
  }
  const newest = await newestRecords({ auth, customerId, def, limit: 1 });
  await store.put(LAST_ID_KEY, idOf({ def, row: newest[0] }) ?? '0');
}

async function accountTimeZone({ auth, customerId }: { auth: GoogleAdsAuthValue; customerId: string }): Promise<string> {
  const page = await GoogleAdsApi.search({ auth, customerId, query: 'SELECT customer.time_zone FROM customer LIMIT 1' });
  const timeZone = page.results?.[0] === undefined ? undefined : readField({ row: page.results[0], gaqlPath: 'customer.time_zone' });
  if (typeof timeZone !== 'string' || timeZone === '') {
    throw new Error(`Google Ads did not return the time zone of account ${customerId}, which is needed to ignore creations made before the trigger was enabled.`);
  }
  return timeZone;
}

async function createdSince({ auth, customerId, def, changeEventType, state, store }: CreatedSinceParams): Promise<GoogleAdsRow[]> {
  const now = new Date();
  const plan = planEventsQuery({ changeEventType, state, now, limit: EVENTS_PER_POLL });
  const { results } = await GoogleAdsApi.searchAll({ auth, customerId, query: plan.query, maxRows: EVENTS_PER_POLL });
  const events = toCreateEvents(results);
  const fresh = freshEvents({ state: plan.state, events });
  const prefix = `customers/${normalizeCustomerId(customerId)}/${def.collection}/`;
  const retried = state.pending ?? [];
  const freshNames = fresh
    .filter((event) => !beforeActivation({ state, event }))
    .map((event) => event.resourceName)
    .filter((name) => name.startsWith(prefix));
  const resourceNames = [...new Set([...retried.map((record) => `${prefix}${record.id}`), ...freshNames])];
  const byName = await recordsByResourceNames({ auth, customerId, def, resourceNames });
  const admission = admit({ def, prefix, byName, retried, events, fresh, now: now.getTime(), state });
  const absorbed = absorbAdmitted({ state: plan.state, events, fresh, full: results.length >= EVENTS_PER_POLL, cut: admission.cut });
  if (absorbed.overflow !== undefined) {
    console.warn(
      `Google Ads New Record: ad group ${absorbed.overflow.adGroupId} has at least ${EVENTS_PER_POLL} creations at ${absorbed.overflow.time}, the most one change history query can return. Creations beyond those rows cannot be read and do not fire.`
    );
  }
  await store.put(EVENTS_KEY, withPending({ state: absorbed.state, pending: admission.pending, enabledAt: state.enabledAt }));
  return admission.rows;
}

function admit({ def, prefix, byName, retried, events, fresh, now, state }: AdmitParams): Admission {
  const rows: GoogleAdsRow[] = [];
  const pending: PendingRecord[] = [];
  const handled = new Set<string>();
  for (const record of retried) {
    handled.add(record.id);
    const row = byName.get(`${prefix}${record.id}`);
    if (row === undefined) {
      if (now - record.at < RETRY_WINDOW_MS) {
        pending.push(record);
      }
    } else if (fires({ def, row })) {
      rows.push(row);
    }
  }
  const isFresh = new Set(fresh);
  for (const [index, event] of events.entries()) {
    const id = event.resourceName.slice(prefix.length);
    if (!isFresh.has(event) || !event.resourceName.startsWith(prefix) || handled.has(id) || beforeActivation({ state, event })) {
      continue;
    }
    const row = byName.get(event.resourceName);
    if (row === undefined && pending.length >= MAX_PENDING) {
      return { rows, pending, cut: index };
    }
    handled.add(id);
    if (row === undefined) {
      pending.push({ id, at: now });
    } else if (fires({ def, row })) {
      rows.push(row);
    }
  }
  return { rows, pending };
}

function absorbAdmitted({ state, events, fresh, full, cut }: AbsorbAdmittedParams): ReturnType<typeof absorbEvents> {
  if (cut === undefined) {
    return absorbEvents({ state, events, full });
  }
  const admitted = events.slice(0, cut);
  const isFresh = new Set(fresh);
  if (!admitted.some((event) => isFresh.has(event))) {
    return { state, fresh: [] };
  }
  return absorbEvents({ state, events: admitted, full: true });
}

async function recordsByResourceNames({ auth, customerId, def, resourceNames }: RecordsByResourceNamesParams): Promise<Map<string, GoogleAdsRow>> {
  const rows: GoogleAdsRow[] = [];
  for (let start = 0; start < resourceNames.length; start += NAMES_PER_QUERY) {
    const chunk = resourceNames.slice(start, start + NAMES_PER_QUERY);
    const { results } = await GoogleAdsApi.searchAll({ auth, customerId, query: recordsByResourceNamesQuery({ def, resourceNames: chunk }), maxRows: chunk.length });
    rows.push(...results);
  }
  return new Map(rows.map((row) => [String(readField({ row, gaqlPath: `${def.type}.resource_name` })), row]));
}

function fires({ def, row }: { def: ResourceDefinition; row: GoogleAdsRow }): boolean {
  return isOfKind({ def, row }) && !(def.statusField !== undefined && readField({ row, gaqlPath: def.statusField }) === 'REMOVED');
}

function withPending({ state, pending, enabledAt }: WithPendingParams): CreateEventState {
  return {
    floor: state.floor,
    seen: state.seen,
    ...(state.boundary === undefined ? {} : { boundary: state.boundary }),
    ...(pending.length === 0 ? {} : { pending }),
    ...(enabledAt === undefined ? {} : { enabledAt }),
  };
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
const BASELINE_EVENTS = 5_000;
const RETRY_WINDOW_MS = 30 * 60_000;
const MAX_PENDING = 1_000;

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

type AdmitParams = {
  def: ResourceDefinition;
  prefix: string;
  byName: Map<string, GoogleAdsRow>;
  retried: PendingRecord[];
  events: CreateEvent[];
  fresh: CreateEvent[];
  now: number;
  state: CreateEventState;
};

type Admission = { rows: GoogleAdsRow[]; pending: PendingRecord[]; cut?: number };

type WithPendingParams = { state: CreateEventState; pending: PendingRecord[]; enabledAt: string | undefined };

type AbsorbAdmittedParams = { state: CreateEventState; events: CreateEvent[]; fresh: CreateEvent[]; full: boolean; cut: number | undefined };
