import { createTrigger, Property, TriggerStrategy, type Store } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { famulorAuth } from '../auth';
import { famulorApi } from '../common/client';

function timestamp({ record, field }: { record: Record<string, unknown>; field: string }): number {
  const value = record[field];
  const parsed = typeof value === 'string' ? Date.parse(value) : NaN;
  if (!Number.isFinite(parsed)) throw new Error(`Famulor record has an invalid ${field}. The polling checkpoint was preserved.`);
  return parsed;
}

async function items({ token, definition, since, campaignId, test }: { token: string; definition: PollDefinition; since: number; campaignId?: string; test?: boolean }): Promise<PollItem[]> {
  if (definition.campaign && (!campaignId || !/^[a-f0-9-]{36}$/i.test(campaignId))) throw new Error('Select a valid campaign UUID from this workspace.');
  const path = definition.campaign ? `/campaigns/${campaignId}/leads` : definition.path;
  const collected: PollItem[] = [];
  for (let offset = 0; offset < 50000; offset += 100) {
    const body = await famulorApi.request({ token, method: HttpMethod.GET, path, query: { ...definition.query, ...(path === '/leads' && since > 0 ? { created_from: new Date(since).toISOString() } : {}), limit: '100', offset: String(offset) } });
    if (!famulorApi.isRecord(body) || !Array.isArray(body['data'])) throw new Error('Famulor returned an invalid list response.');
    if (famulorApi.isRecord(body['meta']) && body['meta']['result_cap_reached'] === true) throw new Error('Famulor capped this result set. The polling checkpoint was preserved.');
    const page = body['data'].map((record: unknown) => {
      if (!famulorApi.isRecord(record) || typeof record['id'] !== 'string') throw new Error('Famulor returned an invalid record identifier.');
      const time = timestamp({ record, field: definition.timeField });
      return { time, key: `${record['channel'] ?? definition.name}:${record['id']}`, record };
    });
    collected.push(...page.filter((item) => (definition.campaign || definition.snapshot || item.time >= since) && (!definition.messaging || !['call', 'avatar', 'live_chat', 'whatsapp_voice'].includes(String(item.record['channel'])))));
    if (test || page.length < 100 || (!(definition.campaign || definition.snapshot) && page.some((item) => item.time < since))) return collected;
  }
  throw new Error('The polling batch exceeded 50,000 records. The checkpoint was preserved; contact Famulor support.');
}

async function poll({ store, token, definition, campaignId }: { store: Store; token: string; definition: PollDefinition; campaignId?: string }): Promise<unknown[]> {
  const checkpoint = await store.get<Checkpoint>('checkpoint');
  if (!checkpoint) throw new Error('Enable this flow to initialize its polling checkpoint.');
  const batch = await items({ token, definition, since: checkpoint.time, campaignId });
  const unique = [...new Map(batch.map((item) => [`${item.key}:${item.time}`, item])).values()];
  const candidates = unique.filter((item) => definition.campaign || definition.snapshot || item.time > checkpoint.time || !checkpoint.keys.includes(item.key));
  const events: PollItem[] = [];
  for (const item of candidates) {
    if ((definition.campaign || definition.snapshot) && await store.get<boolean>(`seen:${item.key}`)) continue;
    if (definition.completed) {
      const ended = timestamp({ record: item.record, field: 'ended_at' });
      if (ended < checkpoint.started || await store.get<boolean>(`completed:${item.key}`)) continue;
    }
    events.push(item);
  }
  const latest = Math.max(checkpoint.time, ...batch.map((item) => item.time));
  const keys = [...new Set([...batch.filter((item) => item.time === latest).map((item) => item.key), ...(latest === checkpoint.time ? checkpoint.keys : [])])];
  for (const item of events) if (definition.completed) await store.put(`completed:${item.key}`, true);
  for (const item of events) if (definition.campaign || definition.snapshot) await store.put(`seen:${item.key}`, true);
  await store.put('checkpoint', { started: checkpoint.started, time: latest, keys });
  return events.sort((a, b) => a.time - b.time).map((item) => item.record);
}

function pollingTrigger(definition: PollDefinition) {
  return createTrigger({
    auth: famulorAuth, name: definition.name, displayName: definition.displayName,
    description: definition.description, classification: 'READ',
    aiMetadata: { description: definition.description },
    props: { campaign_id: Property.ShortText({ displayName: 'Campaign ID', description: 'Campaign UUID from this workspace. Required only for New Campaign Lead.', required: definition.campaign === true }) },
    type: TriggerStrategy.POLLING,
    sampleData: { id: '00000000-0000-4000-8000-000000000001', created_at: '2026-10-01T10:00:00Z', updated_at: '2026-10-01T10:00:00Z' },
    async onEnable(context) {
      if (context.isRepublish && await context.store.get('checkpoint')) return;
      const now = Date.now();
      if (definition.campaign || definition.snapshot) {
        const existing = await items({ token: context.auth.secret_text, definition, since: 0, campaignId: context.propsValue.campaign_id });
        for (const item of existing) await context.store.put(`seen:${item.key}`, true);
      }
      await context.store.put('checkpoint', { started: now, time: now, keys: [] });
    },
    async onDisable() {},
    async test(context) {
      return (await items({ token: context.auth.secret_text, definition, since: 0, campaignId: context.propsValue.campaign_id, test: true })).slice(0, 5).map((item) => item.record);
    },
    async run(context) {
      return poll({ store: context.store, token: context.auth.secret_text, definition, campaignId: context.propsValue.campaign_id });
    },
  });
}

export const pollingDefinitions: PollDefinition[] = [
  { name: 'newCall', displayName: 'New Call', description: 'Triggers when a new call is created in the workspace.', path: '/calls', timeField: 'created_at' },
  { name: 'phoneCallEnded', displayName: 'Phone Call Completed', description: 'Triggers once when a call completes after the flow is enabled. Polls updated calls so calls created earlier can still finish later.', path: '/calls', timeField: 'updated_at', query: { status: 'completed', sort: 'updated_at' }, completed: true },
  { name: 'inboundCall', displayName: 'New Inbound Call', description: 'Triggers when a new inbound call is created. This event does not provide synchronous caller-variable enrichment.', path: '/calls', timeField: 'created_at', query: { direction: 'inbound' } },
  { name: 'getAssistants', displayName: 'New Assistant', description: 'Triggers when an assistant is created in the workspace.', path: '/assistants', timeField: 'created_at' },
  { name: 'newContact', displayName: 'New Contact', description: 'Triggers when a new Audience contact is created in the workspace.', path: '/leads', timeField: 'created_at' },
  { name: 'newCampaign', displayName: 'New Campaign', description: 'Triggers when a campaign is created in the workspace.', path: '/campaigns', timeField: 'created_at' },
  { name: 'newCampaignLead', displayName: 'New Campaign Lead', description: 'Triggers when a lead is added to the selected campaign.', path: '/campaigns', timeField: 'created_at', campaign: true },
  { name: 'conversationEnded', displayName: 'Conversation Completed', description: 'Triggers once when a messaging or email conversation first appears completed after enabling the flow. Reads the completed history; existing completed conversations are skipped.', path: '/history', timeField: 'last_activity_at', query: { status: 'completed' }, snapshot: true, messaging: true },
  { name: 'newHistoryActivity', displayName: 'New Conversation Activity', description: 'Triggers for new activity in the unified conversation history, including calls, messaging and email. A conversation can emit again when its last activity changes.', path: '/history', timeField: 'last_activity_at' },
];
export const pollingTriggers = pollingDefinitions.map(pollingTrigger);
export const famulorPolling = { poll, items };

type PollDefinition = { name: string; displayName: string; description: string; path: string; timeField: string; query?: Record<string, string>; completed?: boolean; campaign?: boolean; snapshot?: boolean; messaging?: boolean };
type PollItem = { time: number; key: string; record: Record<string, unknown> };
type Checkpoint = { started: number; time: number; keys: string[] };
