import { afterEach, describe, expect, test, vi } from 'vitest';
import { OutputSchema, Store } from '@activepieces/pieces-framework';
import { activecampaign } from '../src/index';
import { updatedContactTrigger } from '../src/lib/triggers/updated-contact';
import { newContactSubscribedTrigger } from '../src/lib/triggers/new-contact-subscribed';
import { campaignLinkClickedTrigger } from '../src/lib/triggers/campaign-link-clicked';
import { dealTaskCompletedTrigger } from '../src/lib/triggers/deal-task-completed';
import { newCampaignBounceTrigger } from '../src/lib/triggers/new-campaign-bounce';
import { activeCampaignWebhook } from '../src/lib/common/webhook';

afterEach(() => vi.unstubAllGlobals());

const AUTH = { type: 'CUSTOM_AUTH', props: { apiUrl: 'https://acme.api-us1.com', apiKey: 'key' } };

const EVENT = {
  type: 'update',
  date_time: '2024-02-28T07:16:48-06:00',
  initiated_from: 'admin',
  contact: { id: '3', email: 'a@b.co' },
  updated_fields: ['first_name'],
};

describe('trigger metadata', () => {
  test('every trigger has an outputSchema and sampleData whose type matches its event', () => {
    for (const trigger of Object.values(activecampaign.triggers())) {
      expect(trigger.outputSchema?.fields.length).toBeGreaterThan(0);
      expect(trigger.sampleData).toBeTruthy();
    }
    expect(dealTaskCompletedTrigger.sampleData).toMatchObject({ type: 'deal_task_complete', task: { id: '7', donedate_iso: '2026-11-08T05:15:40-06:00' } });
    expect(campaignLinkClickedTrigger.sampleData).toMatchObject({ type: 'click', link: { url: 'https://example.com' }, campaign: { message: { id: '9' } }, account_id: '1000001' });
    expect(newCampaignBounceTrigger.sampleData).toMatchObject({ type: 'bounce', bounce: { type: 'hard', code: '5.1.1' }, list: [{ id: '3' }], account_id: '1000001' });
    expect(JSON.stringify(newCampaignBounceTrigger.sampleData)).toContain('NoSuchUser <trace-id> - gsmtp');
  });
});

describe('trigger outputSchemas scored both ways against the live captures (sampleData)', () => {
  const captured = [
    'activecampaign_updated_contact',
    'activecampaign_new_tag_added_or_removed_from_contact',
    'activecampaign_new_contact_note',
    'activecampaign_new_contact_task',
    'activecampaign_new_or_updated_account',
    'activecampaign_new_contact_subscribed',
    'activecampaign_contact_unsubscribed',
    'activecampaign_new_deal_added_or_updated',
    'activecampaign_new_deal_note',
    'activecampaign_new_deal_task',
    'activecampaign_deal_task_completed',
    'activecampaign_campaign_link_clicked',
    'activecampaign_new_campaign_bounce',
  ];
  const optional = new Set(['task.note', 'contact.fields']);
  const optionalByTrigger: Record<string, string[]> = { activecampaign_contact_unsubscribed: ['campaign', 'unsubscribe'] };

  test('all 13 triggers are scored', () => {
    expect([...captured].sort()).toEqual(Object.keys(activecampaign.triggers()).sort());
  });

  test.each(captured)('%s has no dead and no unmodelled fields', (name) => {
    const trigger = activecampaign.triggers()[name];
    const { dead, unmodelled } = score({ fields: trigger.outputSchema?.fields ?? [], value: trigger.sampleData, path: '' });
    expect(dead.filter((field) => !optional.has(field) && !(optionalByTrigger[name] ?? []).includes(field))).toEqual([]);
    expect(unmodelled).toEqual([]);
  });

  test('the samples are the captured shapes', () => {
    const triggers = activecampaign.triggers();
    expect(triggers['activecampaign_contact_unsubscribed'].sampleData).toMatchObject({ list: [{ id: '3', name: 'Master Contact List' }], active_subscriptions: ['0'] });
    expect(triggers['activecampaign_updated_contact'].sampleData).toMatchObject({ initiated_from: 'api', contact: { fields: ['fr'] } });
    expect(triggers['activecampaign_new_deal_added_or_updated'].sampleData).toMatchObject({ type: 'deal_update', deal: { value_raw: '0.29', currency_symbol: '$', contact_email: 'apqa1@example.com' } });
    expect(triggers['activecampaign_new_deal_note'].sampleData).toMatchObject({ type: 'deal_note_add', note: { id: '6', text: 'deal note from AP' } });
    expect(triggers['activecampaign_new_deal_task'].sampleData).toMatchObject({ type: 'deal_task_add', task: { id: '7', type_title: 'Call' } });
    const samples = JSON.stringify(Object.values(triggers).map((trigger) => trigger.sampleData));
    expect(samples).not.toMatch(/@(?!example\.com)[a-z0-9.-]+\.[a-z]+/i);
    expect(samples).not.toContain('activepieces95886');
    for (const name of ['activecampaign_new_deal_added_or_updated', 'activecampaign_new_deal_note', 'activecampaign_new_deal_task', 'activecampaign_deal_task_completed']) {
      expect(triggers[name].sampleData).toMatchObject({ deal: { owner_firstname: 'Alex', owner_lastname: 'Owner', pipeline_title: 'Sales Pipeline' } });
    }
  });

  test('every trigger that API calls can fire warns about loops; campaign triggers do not', () => {
    for (const [name, trigger] of Object.entries(activecampaign.triggers())) {
      const warns = trigger.description.includes('can trigger itself again');
      expect(warns).toBe(!['activecampaign_campaign_link_clicked', 'activecampaign_new_campaign_bounce'].includes(name));
    }
  });
});

describe('onEnable', () => {
  test('creates the hook and stores the response under the existing key', async () => {
    const seen = route({ 'POST /api/3/webhooks': { status: 201, body: { webhook: { id: '17', name: 'x', events: ['update'], sources: [] } } } });
    const store = memoryStore();
    await updatedContactTrigger.onEnable(ctx({ store }));
    expect(seen[0].body).toEqual({
      webhook: { name: 'Activepieces Updated Contact Hook', url: 'https://ap.example.com/hook', events: ['update'], sources: ['public', 'admin', 'api', 'system'] },
    });
    expect(store.data.get('activecampaign_updated_contact')).toMatchObject({ webhook: { id: '17' } });
  });

  test('link-click hook carries its own name', async () => {
    const seen = route({ 'POST /api/3/webhooks': { status: 201, body: { webhook: { id: '18' } } } });
    await campaignLinkClickedTrigger.onEnable(ctx({ store: memoryStore() }));
    expect(seen[0].body).toMatchObject({ webhook: { name: 'Activepieces Campaign Link Click Hook', events: ['click'] } });
  });

  test('a failed store write deletes the hook it created and rethrows', async () => {
    const seen = route({
      'POST /api/3/webhooks': { status: 201, body: { webhook: { id: '17' } } },
      'DELETE /api/3/webhooks/17': { status: 200, body: {} },
    });
    const store = memoryStore();
    store.put = async () => {
      throw new Error('store down');
    };
    await expect(newContactSubscribedTrigger.onEnable(ctx({ store }))).rejects.toThrow('store down');
    expect(seen.map((r) => r.key)).toEqual(['POST /api/3/webhooks', 'DELETE /api/3/webhooks/17']);
  });

  test('a failed create throws and stores nothing', async () => {
    route({ 'POST /api/3/webhooks': { status: 422, body: { errors: [{ title: 'Invalid event' }] } } });
    const store = memoryStore();
    await expect(updatedContactTrigger.onEnable(ctx({ store }))).rejects.toThrow('Invalid event');
    expect(store.data.size).toBe(0);
  });
});

describe('onDisable', () => {
  test('deletes the hook and forgets it', async () => {
    const seen = route({ 'DELETE /api/3/webhooks/17': { status: 200, body: {} } });
    const store = memoryStore({ activecampaign_updated_contact: { webhook: { id: '17' } } });
    await updatedContactTrigger.onDisable(ctx({ store }));
    expect(seen).toHaveLength(1);
    expect(store.data.has('activecampaign_updated_contact')).toBe(false);
  });

  test('a 404 (hook already gone) resolves', async () => {
    route({ 'DELETE /api/3/webhooks/17': { status: 404, body: { message: 'No Result found' } } });
    const store = memoryStore({ activecampaign_updated_contact: { webhook: { id: '17' } } });
    await expect(updatedContactTrigger.onDisable(ctx({ store }))).resolves.toBeUndefined();
    expect(store.data.has('activecampaign_updated_contact')).toBe(false);
  });

  test('a 500 rejects and keeps the ID for a retry', async () => {
    route({ 'DELETE /api/3/webhooks/17': { status: 500, body: { message: 'boom' } } });
    const store = memoryStore({ activecampaign_updated_contact: { webhook: { id: '17' } } });
    await expect(updatedContactTrigger.onDisable(ctx({ store }))).rejects.toThrow('(500): boom');
    expect(store.data.has('activecampaign_updated_contact')).toBe(true);
  });
});

describe('run and dedupe', () => {
  test('the same delivery twice fires once', async () => {
    const store = memoryStore();
    expect(await updatedContactTrigger.run(ctx({ store, body: EVENT }))).toEqual([EVENT]);
    expect(await updatedContactTrigger.run(ctx({ store, body: { ...EVENT } }))).toEqual([]);
  });

  test('different updated_fields in the same second both fire', async () => {
    const store = memoryStore();
    await updatedContactTrigger.run(ctx({ store, body: EVENT }));
    const other = { ...EVENT, updated_fields: ['phone'] };
    expect(await updatedContactTrigger.run(ctx({ store, body: other }))).toEqual([other]);
  });

  test('a string body is parsed', async () => {
    const store = memoryStore();
    expect(await updatedContactTrigger.run(ctx({ store, body: JSON.stringify(EVENT) }))).toEqual([EVENT]);
  });

  test('two different changes to the same contact in the same second both fire', async () => {
    const store = memoryStore();
    const first = { type: 'update', date_time: EVENT.date_time, contact: { id: '3', email: 'a@b.co', first_name: 'Ann' } };
    const second = { type: 'update', date_time: EVENT.date_time, contact: { id: '3', email: 'a@b.co', first_name: 'Anna' } };
    expect(await updatedContactTrigger.run(ctx({ store, body: first }))).toEqual([first]);
    expect(await updatedContactTrigger.run(ctx({ store, body: second }))).toEqual([second]);
    expect(await updatedContactTrigger.run(ctx({ store, body: { ...second, contact: { first_name: 'Anna', email: 'a@b.co', id: '3' } } }))).toEqual([]);
  });

  test('the window expires after 15 minutes', async () => {
    const store = memoryStore();
    await activeCampaignWebhook.run({ store, storeKey: 'k', body: EVENT, now: 0 });
    expect(await activeCampaignWebhook.run({ store, storeKey: 'k', body: EVENT, now: 14 * 60_000 })).toEqual([]);
    expect(await activeCampaignWebhook.run({ store, storeKey: 'k', body: EVENT, now: 16 * 60_000 })).toEqual([EVENT]);
  });

  test('a retry is still skipped after 4,999 newer deliveries in the window, and the list stays bounded', async () => {
    const key = activeCampaignWebhook.dedupeKey(EVENT);
    const newer = Array.from({ length: 4999 }, (_, index) => ({ key: `newer-${index}`, at: 60_000 }));
    const store = memoryStore({ k_recent_deliveries: [{ key, at: 0 }, ...newer] });
    expect(await activeCampaignWebhook.run({ store, storeKey: 'k', body: EVENT, now: 2 * 60_000 })).toEqual([]);
    const other = { ...EVENT, contact: { id: '4' } };
    expect(await activeCampaignWebhook.run({ store, storeKey: 'k', body: other, now: 2 * 60_000 })).toEqual([other]);
    const ring = store.data.get('k_recent_deliveries');
    expect(Array.isArray(ring) ? ring.length : -1).toBe(5000);
    expect(JSON.stringify(ring).length).toBeLessThan(512 * 1024);
  });

  test('a payload without type and date_time is not deduped', async () => {
    const store = memoryStore();
    expect(await updatedContactTrigger.run(ctx({ store, body: { foo: 1 } }))).toEqual([{ foo: 1 }]);
    expect(await updatedContactTrigger.run(ctx({ store, body: { foo: 1 } }))).toEqual([{ foo: 1 }]);
  });
});

function ctx({ store, body }: { store: Store; body?: unknown }) {
  return Object.assign(Object.create(null), {
    auth: AUTH,
    store,
    webhookUrl: 'https://ap.example.com/hook',
    payload: { body, headers: {}, queryParams: {} },
    propsValue: {},
  });
}

function score({ fields, value, path }: { fields: OutputSchema['fields']; value: unknown; path: string }): { dead: string[]; unmodelled: string[] } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { dead: [], unmodelled: [] };
  }
  const record = Object.fromEntries(Object.entries(value));
  const known = new Set(fields.map((field) => field.value ?? field.key));
  const results = fields.map((field) => {
    const key = field.value ?? field.key;
    const here = `${path}${key}`;
    if (!(key in record)) {
      return { dead: [here], unmodelled: [] };
    }
    return field.children && !field.dynamicKey ? score({ fields: field.children, value: record[key], path: `${here}.` }) : { dead: [], unmodelled: [] };
  });
  return {
    dead: results.flatMap((result) => result.dead),
    unmodelled: [...Object.keys(record).filter((key) => !known.has(key)).map((key) => `${path}${key}`), ...results.flatMap((result) => result.unmodelled)],
  };
}

function memoryStore(initial: Record<string, unknown> = {}): Store & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    data,
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, value);
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return data.has(key) ? JSON.parse(JSON.stringify(data.get(key))) : null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
}

function route(routes: Record<string, { status: number; body: unknown }>): Seen[] {
  const seen: Seen[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input);
      const key = `${init?.method ?? 'GET'} ${url.pathname}`;
      seen.push({ key, body: typeof init?.body === 'string' ? JSON.parse(init.body) : null });
      const reply = routes[key];
      if (!reply) {
        return new Response(JSON.stringify({ message: `unexpected ${key}` }), { status: 599 });
      }
      return new Response(JSON.stringify(reply.body), { status: reply.status });
    }),
  );
  return seen;
}

type Seen = { key: string; body: unknown };
