import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { famulorPolling, pollingDefinitions, pollingTriggers } from '../src/lib/triggers/polling';

function store(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { get: vi.fn(async (key) => values.get(key)), put: vi.fn(async (key, value) => { values.set(key, value); return value; }), delete: async (key) => values.delete(key), values };
}
const date = (time) => new Date(time).toISOString();
const definition = (name) => pollingDefinitions.find((item) => item.name === name);
const trigger = (name) => pollingTriggers.find((item) => item.name === name);
const record = (id, time) => ({ id, created_at: date(time), updated_at: date(time), ended_at: date(time), last_activity_at: date(time) });
const response = (data, def) => ({ status: 200, headers: {}, body: { data: def?.dataKey ? { [def.dataKey]: data } : data } });
const token = 'test-workspace-key';
const campaignId = '00000000-0000-4000-8000-000000000001';
const context = (state, payload) => ({ store: state, auth: { secret_text: token }, propsValue: { campaign_id: campaignId }, payload });
const run = (state, name) => trigger(name).run(context(state));
const acknowledge = async (state, name, payloads) => {
  for (const payload of payloads) {
    const delivered = { ...payload };
    delete delivered[DEDUPE_KEY_PROPERTY];
    await trigger(name).onStart(context(state, delivered));
  }
};
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe('every registered native trigger', () => {
  it.each(pollingDefinitions)('enables, samples, polls and acknowledges $name ($path)', async (def) => {
    vi.useFakeTimers().setSystemTime(1000);
    const state = store();
    const existing = { ...record('existing', 500), channel: 'email' };
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([existing], def));
    await trigger(def.name).onEnable(context(state));
    const checkpoint = await state.get('checkpoint');
    expect(checkpoint).toMatchObject({ started: 1000, time: 1000 });
    expect(checkpoint.generation).toMatch(/^[a-f0-9-]{36}$/);
    vi.setSystemTime(3000);
    const added = { ...record('added', 2000), channel: 'email' };
    send.mockResolvedValue(response([added, existing], def));
    const mutations = state.put.mock.calls.length;
    expect(await trigger(def.name).test(context(state))).toEqual([added, existing]);
    expect(state.put).toHaveBeenCalledTimes(mutations);
    const result = await run(state, def.name);
    expect(result.map((item) => item.id)).toEqual(['added']);
    expect(result[0][DEDUPE_KEY_PROPERTY]).toMatch(/^[a-f0-9]{64}$/);
    const req = send.mock.lastCall[0];
    expect(req.method).toBe('GET');
    expect(req.url).toBe(`https://app.famulor.io/api/v1${def.campaign ? `/campaigns/${campaignId}/leads` : def.path}`);
    expect(req.queryParams).toMatchObject(def.query ?? {});
    expect(req.authentication.token).toBe(token);
    await acknowledge(state, def.name, result);
    expect(await run(state, def.name)).toEqual([]);
  });
});

describe('polling delivery and checkpoints', () => {
  it.each(pollingDefinitions)('allows editor Test Flow before enable for $name', async (def) => {
    const state = store();
    await expect(trigger(def.name).onStart(context(state, record('sample', 1000)))).resolves.toBeUndefined();
    expect(state.get).not.toHaveBeenCalled();
    expect(state.put).not.toHaveBeenCalled();
  });
  it('does not acknowledge samples in enabled flows or stale-generation queued runs', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000, generation: 'new-generation' } });
    await trigger('newCall').onStart(context(state, record('sample', 2000)));
    await trigger('newCall').onStart(context(state, { ...record('old-run', 2000), _famulor_delivery: { generation: 'old-generation', key: 'old-key' } }));
    expect(state.put).not.toHaveBeenCalled();
  });
  it('replays a payload when submission failed before onStart', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000 } });
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([record('pending', 2000), record('later', 3000)]));
    const first = await run(state, 'newCall');
    expect((await state.get('checkpoint')).time).toBe(2000);
    expect(await run(state, 'newCall')).toEqual(first);
    await acknowledge(state, 'newCall', [first[0]]);
    const later = await run(state, 'newCall');
    expect(later.map((item) => item.id)).toEqual(['later']);
    expect((await state.get('checkpoint')).time).toBe(3000);
  });
  it('gives overlapping polls the same native dedupe keys', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000 } });
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([record('overlap', 2000)]));
    const [first, second] = await Promise.all([run(state, 'newCall'), run(state, 'newCall')]);
    expect(first).toEqual(second);
    expect(first[0][DEDUPE_KEY_PROPERTY]).toHaveLength(64);
    await acknowledge(state, 'newCall', first);
    expect(await run(state, 'newCall')).toEqual([]);
  });
  it('handles empty pages without changing the cursor', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000 } });
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([]));
    expect(await run(state, 'newCall')).toEqual([]);
    expect((await state.get('checkpoint')).time).toBe(1000);
  });
  it('processes all pages and preserves new events at equal timestamp boundaries', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000 } });
    const page = Array.from({ length: 100 }, (_, index) => record(`call-${index}`, 2000));
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(response(page)).mockResolvedValueOnce(response([record('extra', 2000)]));
    const result = await run(state, 'newCall');
    expect(result).toHaveLength(101);
    expect(send.mock.calls[1][0].queryParams.offset).toBe('100');
    await acknowledge(state, 'newCall', result);
    send.mockResolvedValue(response([record('extra', 2000), record('same-second-new', 2000)]));
    expect((await run(state, 'newCall')).map((item) => item.id)).toEqual(['same-second-new']);
  });
  it('preserves the checkpoint after invalid timestamps or later-page failures', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000 } });
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([{ id: 'bad', created_at: 'not-a-date' }]));
    await expect(run(state, 'newCall')).rejects.toThrow('invalid created_at');
    expect((await state.get('checkpoint')).time).toBe(1000);
    send.mockResolvedValueOnce(response(Array.from({ length: 100 }, (_, index) => record(`call-${index}`, 2000)))).mockRejectedValueOnce(new Error('rate limited'));
    await expect(run(state, 'newCall')).rejects.toThrow('rate limited');
    expect((await state.get('checkpoint')).time).toBe(1000);
  });
  it('holds future timestamps back without poisoning the cursor', async () => {
    vi.useFakeTimers().setSystemTime(3000);
    const state = store({ checkpoint: { started: 1000, time: 1000 } });
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([record('future', 4000), record('present', 2000)]));
    expect((await run(state, 'newCall')).map((item) => item.id)).toEqual(['present']);
    expect((await state.get('checkpoint')).time).toBe(2000);
  });
  it('finds old calls that finish later and acknowledges each completion by ID', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000 } });
    const call = { id: 'old-call', created_at: date(500), updated_at: date(2000), ended_at: date(1800), status: 'completed' };
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([call]));
    const result = await run(state, 'phoneCallEnded');
    expect(result[0]).toMatchObject(call);
    expect(send.mock.calls[0][0].queryParams).toMatchObject({ sort: 'updated_at', status: 'completed' });
    await acknowledge(state, 'phoneCallEnded', result);
    send.mockResolvedValue(response([{ ...call, updated_at: date(3000) }]));
    expect(await run(state, 'phoneCallEnded')).toEqual([]);
  });
  it('does not emit historical completions after reanalysis', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000 } });
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([{ ...record('old', 2000), ended_at: date(500) }]));
    expect(await run(state, 'phoneCallEnded')).toEqual([]);
  });
  it('keeps the generation and checkpoint on republish', async () => {
    const checkpoint = { started: 1000, time: 2000, generation: 'same-publish' };
    const state = store({ checkpoint });
    await trigger('newCall').onEnable({ store: state, isRepublish: true });
    expect(await state.get('checkpoint')).toEqual(checkpoint);
    expect(state.put).not.toHaveBeenCalled();
  });
  it('filters new contacts by creation time and rejects capped responses', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000 } });
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ ...response([record('contact', 2000)]), body: { data: [record('contact', 2000)], meta: { result_cap_reached: true } } });
    await expect(run(state, 'newContact')).rejects.toThrow('capped');
    expect(send.mock.calls[0][0].queryParams.created_from).toBe(date(1000));
    expect((await state.get('checkpoint')).time).toBe(1000);
  });
  it('detects newly assigned existing contacts and retries until they are delivered', async () => {
    const state = store();
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([record('existing', 500)]));
    await trigger('newCampaignLead').onEnable(context(state));
    send.mockResolvedValue(response([record('existing', 500), record('assigned-old-contact', 300)]));
    const first = await run(state, 'newCampaignLead');
    expect(first.map((item) => item.id)).toEqual(['assigned-old-contact']);
    expect(await run(state, 'newCampaignLead')).toEqual(first);
    await acknowledge(state, 'newCampaignLead', first);
    expect(await run(state, 'newCampaignLead')).toEqual([]);
    expect(await run(state, 'newCampaignLead')).toEqual([]);
  });
  it('test mode returns samples without storing a checkpoint', async () => {
    const state = store();
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([record('sample', 2000)]));
    expect(await trigger('newCall').test(context(state))).toHaveLength(1);
    expect(state.put).not.toHaveBeenCalled();
  });
  it('filters historical and call conversations when detecting completion', async () => {
    const state = store();
    const old = { ...record('old-completed', 300), channel: 'whatsapp', last_activity_at: date(500), status: 'completed' };
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([old]));
    await trigger('conversationEnded').onEnable(context(state));
    const completed = { ...old, id: 'new-completed', last_activity_at: date(400) };
    send.mockResolvedValue(response([old, completed, { ...completed, id: 'call', channel: 'call' }]));
    const result = await run(state, 'conversationEnded');
    expect(result.map((item) => item.id)).toEqual(['new-completed']);
    await acknowledge(state, 'conversationEnded', result);
    expect(await run(state, 'conversationEnded')).toEqual([]);
  });
  it('scans booking pages even when the first page contains older records', async () => {
    const state = store();
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([]));
    await trigger('newBooking').onEnable(context(state));
    send.mockResolvedValueOnce(response(Array.from({ length: 100 }, (_, i) => record(`old-booking-${i}`, 500)))).mockResolvedValueOnce(response([record('new-on-next-page', 300)]));
    expect((await run(state, 'newBooking')).map((item) => item.id)).toContain('new-on-next-page');
    expect(send.mock.lastCall[0].queryParams.offset).toBe('100');
  });
  it('uses bounded baseline reads instead of a store lookup for every existing lead', async () => {
    const state = store();
    const records = Array.from({ length: 1000 }, (_, i) => record(`existing-${i}`, 500));
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => response(records.slice(Number(req.queryParams.offset), Number(req.queryParams.offset) + 100)));
    await trigger('newCampaignLead').onEnable(context(state));
    state.get.mockClear();
    expect(await run(state, 'newCampaignLead')).toEqual([]);
    expect(state.get).toHaveBeenCalledTimes(33);
    for (const [key, value] of state.values) if (key.startsWith('baseline:')) expect(JSON.stringify(value).length).toBeLessThan(512 * 1024);
  });
  it('fails at the scan safety limit without committing a checkpoint', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000 } });
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response(Array.from({ length: 100 }, (_, i) => record(`overflow-${i}`, 2000))));
    await expect(run(state, 'newCampaignLead')).rejects.toThrow('50,000');
    expect((await state.get('checkpoint')).time).toBe(1000);
    expect(state.put).not.toHaveBeenCalled();
  });
  it('rejects a missing campaign, invalid records, uninitialized flows and invalid acknowledgements', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000 } });
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([{ name: 'no-id' }]));
    await expect(famulorPolling.poll({ store: state, token, definition: definition('newCampaignLead') })).rejects.toThrow('UUID');
    expect(send).not.toHaveBeenCalled();
    await expect(run(state, 'newCall')).rejects.toThrow('identifier');
    await expect(run(store(), 'newCall')).rejects.toThrow('Enable');
    await trigger('newCall').onStart(context(state, {}));
    const bad = { ...record('bad-ack', 2000), _famulor_delivery: { generation: 'initial', key: 'invalid' } };
    await expect(trigger('newCall').onStart(context(state, bad))).rejects.toThrow('acknowledge');
  });
});
