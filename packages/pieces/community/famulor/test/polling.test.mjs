import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { famulorPolling, pollingDefinitions, pollingTriggers } from '../src/lib/triggers/polling';

function store(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { get: async (key) => values.get(key), put: async (key, value) => { values.set(key, value); return value; }, delete: async (key) => values.delete(key) };
}
const date = (time) => new Date(time).toISOString();
const definition = (name) => pollingDefinitions.find((definition) => definition.name === name);
const trigger = (name) => pollingTriggers.find((trigger) => trigger.name === name);
const record = (id, time) => ({ id, created_at: date(time), updated_at: date(time) });
const response = (data) => ({ status: 200, headers: {}, body: { data } });
const token = 'test-workspace-key';
const run = (state, name) => famulorPolling.poll({ store: state, token, definition: definition(name) });
afterEach(() => vi.restoreAllMocks());

describe('polling checkpoints', () => {
  it('handles empty pages without changing the cursor', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000, keys: [] } });
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([]));
    expect(await run(state, 'newCall')).toEqual([]);
    expect((await state.get('checkpoint')).time).toBe(1000);
  });
  it('processes all pages and deduplicates equal timestamps across runs', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000, keys: [] } });
    const page = Array.from({ length: 100 }, (_, index) => record(`call-${index}`, 2000));
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(response(page)).mockResolvedValueOnce(response([record('extra', 2000)]));
    expect(await run(state, 'newCall')).toHaveLength(101);
    expect(send.mock.calls[1][0].queryParams.offset).toBe('100');
    send.mockResolvedValue(response([record('extra', 2000), record('same-second-new', 2000)]));
    expect((await run(state, 'newCall')).map((item) => item.id)).toEqual(['same-second-new']);
  });
  it('preserves the checkpoint after invalid timestamps or later-page failures', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000, keys: [] } });
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([{ id: 'bad', created_at: 'not-a-date' }]));
    await expect(run(state, 'newCall')).rejects.toThrow('invalid created_at');
    expect((await state.get('checkpoint')).time).toBe(1000);
    send.mockResolvedValueOnce(response(Array.from({ length: 100 }, (_, index) => record(`call-${index}`, 2000)))).mockRejectedValueOnce(new Error('rate limited'));
    await expect(run(state, 'newCall')).rejects.toThrow('rate limited');
    expect((await state.get('checkpoint')).time).toBe(1000);
  });
  it('finds old calls that finish later and emits each completion once', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000, keys: [] } });
    const call = { id: 'old-call', created_at: date(500), updated_at: date(2000), ended_at: date(1800), status: 'completed' };
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([call]));
    expect(await run(state, 'phoneCallEnded')).toEqual([call]);
    expect(send.mock.calls[0][0].queryParams).toMatchObject({ sort: 'updated_at', status: 'completed' });
    send.mockResolvedValue(response([{ ...call, updated_at: date(3000) }]));
    expect(await run(state, 'phoneCallEnded')).toEqual([]);
  });
  it('does not emit historical completions after reanalysis', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000, keys: [] } });
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([{ ...record('old', 2000), ended_at: date(500) }]));
    expect(await run(state, 'phoneCallEnded')).toEqual([]);
  });
  it('keeps the checkpoint on republish', async () => {
    const checkpoint = { started: 1000, time: 2000, keys: ['newCall:existing'] };
    const state = store({ checkpoint });
    await trigger('newCall').onEnable({ store: state, isRepublish: true });
    expect(await state.get('checkpoint')).toEqual(checkpoint);
  });
  it('filters new contacts by creation time and rejects capped responses', async () => {
    const state = store({ checkpoint: { started: 1000, time: 1000, keys: [] } });
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ ...response([record('contact', 2000)]), body: { data: [record('contact', 2000)], meta: { result_cap_reached: true } } });
    await expect(run(state, 'newContact')).rejects.toThrow('capped');
    expect(send.mock.calls[0][0].queryParams.created_from).toBe(date(1000));
    expect((await state.get('checkpoint')).time).toBe(1000);
  });
  it('detects newly assigned existing contacts in campaigns', async () => {
    const state = store();
    const campaignId = '00000000-0000-4000-8000-000000000001';
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([record('existing', 500)]));
    await trigger('newCampaignLead').onEnable({ store: state, auth: { secret_text: token }, propsValue: { campaign_id: campaignId } });
    send.mockResolvedValue(response([record('existing', 500), record('assigned-old-contact', 300)]));
    const result = await famulorPolling.poll({ store: state, token, definition: definition('newCampaignLead'), campaignId });
    expect(result.map((item) => item.id)).toEqual(['assigned-old-contact']);
    expect(await famulorPolling.poll({ store: state, token, definition: definition('newCampaignLead'), campaignId })).toEqual([]);
  });
  it('test mode returns samples without storing a checkpoint', async () => {
    const state = store();
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([record('sample', 2000)]));
    const result = await trigger('newCall').test({ store: state, auth: { secret_text: token }, propsValue: {} });
    expect(result).toHaveLength(1);
    expect(await state.get('checkpoint')).toBeUndefined();
  });
  it('finds old messaging conversations completing later, without historical or call events', async () => {
    const state = store();
    const old = { ...record('old-completed', 300), channel: 'whatsapp', last_activity_at: date(500), status: 'completed' };
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([old]));
    await trigger('conversationEnded').onEnable({ store: state, auth: { secret_text: token }, propsValue: {} });
    const completed = { ...old, id: 'new-completed', last_activity_at: date(400) };
    send.mockResolvedValue(response([old, completed, { ...completed, id: 'call', channel: 'call' }]));
    expect(await run(state, 'conversationEnded')).toEqual([completed]);
    expect(await run(state, 'conversationEnded')).toEqual([]);
  });
});
