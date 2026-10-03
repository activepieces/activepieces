import { createHash, randomUUID } from 'node:crypto';
import { createTrigger, DEDUPE_KEY_PROPERTY, TriggerStrategy, type Store } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { famulorAuth } from '../auth';
import { famulorApi } from './client';
import { famulorResources } from './resources';
import { operationById } from './action';

function timestamp({ record, field }: { record: Record<string, unknown>; field?: string }): number {
  if (!field) return 0;
  const value = record[field];
  const parsed = typeof value === 'string' ? Date.parse(value) : NaN;
  if (!Number.isFinite(parsed)) throw new Error(`Famulor record has an invalid ${field}. The polling checkpoint was preserved.`);
  return parsed;
}

function eventKey({ item, definition, generation }: { item: PollItem; definition: PollDefinition; generation?: string }): string {
  return createHash('sha256').update(JSON.stringify([generation ?? 'initial', definition.name, item.key, definition.once ? null : item.time])).digest('hex');
}

function bucket(key: string): number {
  return parseInt(key.slice(0, 2), 16) % 32;
}

async function baseline({ store }: { store: Store }): Promise<Set<string>> {
  const groups = await Promise.all(Array.from({ length: 32 }, (_, index) => store.get<string[]>(`baseline:${index}`)));
  return new Set(groups.flatMap((group) => group ?? []));
}

async function saveBaseline({ store, keys }: { store: Store; keys: Set<string> }): Promise<void> {
  const groups: string[][] = Array.from({ length: 32 }, () => []);
  for (const key of keys) groups[bucket(key)].push(key);
  await Promise.all(groups.map((group, index) => store.put(`baseline:${index}`, group)));
}

async function items({ token, definition, since, campaignId, test }: { token: string; definition: PollDefinition; since: number; campaignId?: string; test?: boolean }): Promise<PollItem[]> {
  if (definition.campaign && (!campaignId || !/^[a-f0-9-]{36}$/i.test(campaignId))) throw new Error('Select a valid campaign UUID from this workspace.');
  const path = definition.campaign ? `/campaigns/${campaignId}/leads` : definition.path;
  const collected: PollItem[] = [];
  const now = Date.now();
  for (let offset = 0; offset < 50000; offset += 100) {
    const body = await famulorApi.request({ token, method: HttpMethod.GET, path, query: { ...definition.query, ...(path === '/leads' && since > 0 ? { created_from: new Date(since).toISOString() } : {}), ...(definition.unpaged ? {} : { limit: '100', offset: String(offset) }) } });
    if (!famulorApi.isRecord(body)) throw new Error('Famulor returned an invalid list response.');
    if (famulorApi.isRecord(body['meta']) && body['meta']['result_cap_reached'] === true) throw new Error('Famulor capped this result set. The polling checkpoint was preserved.');
    const data = body['data'];
    const rows = definition.dataKey && famulorApi.isRecord(data) ? data[definition.dataKey] : data;
    if (!Array.isArray(rows)) throw new Error('Famulor returned an invalid list response.');
    const page = rows.map((record: unknown) => {
      if (!famulorApi.isRecord(record) || typeof record['id'] !== 'string') throw new Error('Famulor returned an invalid record identifier.');
      const time = timestamp({ record, field: definition.timeField });
      return { time, key: `${record['channel'] ?? definition.name}:${record['id']}`, record };
    });
    collected.push(...page.filter((item) => item.time <= now && (definition.snapshot || definition.campaign || item.time >= since) && (!definition.messaging || !['call', 'avatar', 'live_chat', 'whatsapp_voice'].includes(String(item.record['channel'])))));
    if (test || definition.unpaged || page.length < 100 || (definition.ordered !== false && !definition.snapshot && !definition.campaign && page.some((item) => item.time < since))) return collected;
  }
  throw new Error('The polling batch exceeded 50,000 records. The checkpoint was preserved; contact Famulor support.');
}

async function poll({ store, token, definition, campaignId }: { store: Store; token: string; definition: PollDefinition; campaignId?: string }): Promise<unknown[]> {
  const checkpoint = await store.get<Checkpoint>('checkpoint');
  if (!checkpoint) throw new Error('Enable this flow to initialize its polling checkpoint.');
  const batch = await items({ token, definition, since: checkpoint.time, campaignId });
  const unique = [...new Map(batch.map((item) => [eventKey({ item, definition, generation: checkpoint.generation }), item])).values()];
  const known = definition.snapshot || definition.campaign ? await baseline({ store }) : new Set<string>();
  const candidates = unique.filter((item) => !known.has(eventKey({ item, definition, generation: checkpoint.generation })));
  const events: PollItem[] = [];
  let changed = false;
  for (let offset = 0; offset < candidates.length; offset += 20) {
    const group = candidates.slice(offset, offset + 20);
    const delivered = await Promise.all(group.map((item) => store.get<boolean>(`delivered:${eventKey({ item, definition, generation: checkpoint.generation })}`)));
    group.forEach((item, index) => {
      if (delivered[index]) {
        if (definition.snapshot || definition.campaign) {
          known.add(eventKey({ item, definition, generation: checkpoint.generation }));
          changed = true;
        }
      } else if (!definition.completed || timestamp({ record: item.record, field: 'ended_at' }) >= checkpoint.started) events.push(item);
    });
  }
  if (changed) await saveBaseline({ store, keys: known });
  if (!definition.snapshot && !definition.campaign) {
    const nextTime = events.length ? Math.min(...events.map((item) => item.time)) : Math.max(checkpoint.time, ...batch.map((item) => item.time));
    if (nextTime > checkpoint.time) await store.put('checkpoint', { ...checkpoint, time: nextTime });
  }
  return events.sort((a, b) => a.time - b.time).map((item) => ({ ...item.record, [DEDUPE_KEY_PROPERTY]: eventKey({ item, definition, generation: checkpoint.generation }) }));
}

function createPollingTrigger(definition: PollDefinition) {
  const campaign = famulorResources.resourceProperty({ field: { name: 'campaign_id', type: 'string', required: true }, operation: operationById('listLeads') });
  return createTrigger({
    auth: famulorAuth, name: definition.name, displayName: definition.displayName,
    description: definition.description, classification: 'READ',
    aiMetadata: { description: definition.description },
    props: definition.campaign && campaign ? { campaign_id: campaign } : {},
    type: TriggerStrategy.POLLING,
    sampleData: { id: '00000000-0000-4000-8000-000000000001', created_at: '2026-10-01T10:00:00Z', updated_at: '2026-10-01T10:00:00Z', last_activity_at: '2026-10-01T10:00:00Z', ended_at: '2026-10-01T10:00:00Z', ...(definition.query ?? {}) },
    async onEnable(context) {
      if (context.isRepublish && await context.store.get('checkpoint')) return;
      const now = Date.now();
      const generation = randomUUID();
      const existing = definition.snapshot || definition.campaign ? await items({ token: context.auth.secret_text, definition, since: 0, campaignId: context.propsValue['campaign_id'] }) : [];
      await saveBaseline({ store: context.store, keys: new Set(existing.map((item) => eventKey({ item, definition, generation }))) });
      await context.store.put('checkpoint', { started: now, time: now, generation });
    },
    async onDisable() {},
    async onStart(context) {
      const checkpoint = await context.store.get<Checkpoint>('checkpoint');
      if (!checkpoint || !famulorApi.isRecord(context.payload) || typeof context.payload['id'] !== 'string') throw new Error('Famulor cannot acknowledge this trigger payload.');
      const item = { record: context.payload, time: timestamp({ record: context.payload, field: definition.timeField }), key: `${context.payload['channel'] ?? definition.name}:${context.payload['id']}` };
      await context.store.put(`delivered:${eventKey({ item, definition, generation: checkpoint.generation })}`, true);
    },
    async test(context) {
      return (await items({ token: context.auth.secret_text, definition, since: 0, campaignId: context.propsValue['campaign_id'], test: true })).slice(0, 5).map((item) => item.record);
    },
    async run(context) {
      return poll({ store: context.store, token: context.auth.secret_text, definition, campaignId: context.propsValue['campaign_id'] });
    },
  });
}


export const famulorPolling = { poll, items, eventKey };
export { createPollingTrigger };
export type PollDefinition = { name: string; displayName: string; description: string; path: string; timeField?: string; query?: Record<string, string>; completed?: boolean; campaign?: boolean; snapshot?: boolean; messaging?: boolean; once?: boolean; ordered?: boolean; unpaged?: boolean; dataKey?: string };
type PollItem = { time: number; key: string; record: Record<string, unknown> };
type Checkpoint = { started: number; time: number; generation?: string };
