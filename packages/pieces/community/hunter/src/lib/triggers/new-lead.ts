import { createTrigger, Store, TriggerStrategy } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { HunterRecord, apiKeyOf } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { hunterRequests } from '../common/requests';

export const newLeadTrigger = createTrigger({
  auth: hunterAuth,
  name: 'new-lead',
  classification: 'READ',
  displayName: 'New Lead',
  description: 'Fires when a new lead is created.',
  aiMetadata: {
    description:
      'Fires once for each lead created in the connected Hunter account, emitting the lead record (oldest first). Polls the leads list and pages back to the last lead it saw (up to 1000 new leads per poll), so bulk imports are not lost.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  outputSchema: hunterOutputSchemas.leadFlat,
  sampleData: {
    id: 123456789,
    email: 'jane.doe@example.com',
    first_name: 'Jane',
    last_name: 'Doe',
    position: 'Head of Sales',
    company: 'Example Inc',
    company_industry: null,
    company_size: null,
    confidence_score: null,
    website: 'example.com',
    country_code: 'US',
    source: null,
    linkedin_url: null,
    phone_number: null,
    twitter: null,
    sync_status: null,
    notes: null,
    sending_status: null,
    last_activity_at: null,
    last_contacted_at: null,
    verification: { date: null, status: null },
    leads_list: { id: 1234, name: 'My leads', leads_count: 3 },
    created_at: '2026-10-26 10:00:00 UTC',
  },
  async onEnable(context) {
    const newest = await hunterRequests.listLeadsPage({ apiKey: apiKeyOf(context.auth), limit: 1, offset: 0 });
    await context.store.put(LAST_LEAD_ID_KEY, leadIdOf(newest[0]) ?? 0);
  },
  async onDisable(context) {
    await context.store.delete(LAST_LEAD_ID_KEY);
  },
  async test(context) {
    return hunterRequests.listLeadsPage({ apiKey: apiKeyOf(context.auth), limit: 5, offset: 0 });
  },
  async run(context) {
    return pollNewLeads({ apiKey: apiKeyOf(context.auth), store: context.store });
  },
});

export const LAST_LEAD_ID_KEY = 'hunter_last_lead_id';

const PAGE_SIZE = 100;

const MAX_LEADS_PER_POLL = 1000;

async function pollNewLeads({ apiKey, store }: { apiKey: string; store: Store }): Promise<HunterRecord[]> {
  const lastSeen = await store.get<number>(LAST_LEAD_ID_KEY);
  const fresh = await collectNewer({ apiKey, lastSeen: lastSeen ?? 0 });
  if (lastSeen === null) {
    await store.put(LAST_LEAD_ID_KEY, fresh.reduce((max, lead) => Math.max(max, leadIdOf(lead) ?? 0), 0));
    return [];
  }
  if (fresh.length === 0) {
    return [];
  }
  const newestId = fresh.reduce((max, lead) => Math.max(max, leadIdOf(lead) ?? 0), lastSeen);
  await store.put(LAST_LEAD_ID_KEY, newestId);
  return [...fresh].sort((a, b) => (leadIdOf(a) ?? 0) - (leadIdOf(b) ?? 0));
}

async function collectNewer({ apiKey, lastSeen }: { apiKey: string; lastSeen: number }): Promise<HunterRecord[]> {
  const collected: HunterRecord[] = [];
  for (let offset = 0; offset < MAX_LEADS_PER_POLL; offset += PAGE_SIZE) {
    const page = await hunterRequests.listLeadsPage({ apiKey, limit: PAGE_SIZE, offset });
    const newer = page.filter((lead) => (leadIdOf(lead) ?? 0) > lastSeen);
    collected.push(...newer);
    if (page.length < PAGE_SIZE || newer.length < page.length || lastSeen === 0) {
      break;
    }
  }
  return collected.slice(0, MAX_LEADS_PER_POLL);
}

function leadIdOf(lead: HunterRecord | undefined): number | undefined {
  const id = lead?.['id'];
  return typeof id === 'number' ? id : undefined;
}
