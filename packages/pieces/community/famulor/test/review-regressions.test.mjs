import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { piecePropertiesUtils } from '@activepieces/pieces-framework';
import { famulor } from '../src';
import { apiOperation } from '../src/lib/actions/api-operation';
import { operations } from '../src/lib/generated/catalog';
import { famulorPolling, pollingDefinitions, pollingTriggers } from '../src/lib/triggers/polling';

const token = 'test-workspace-key';
const context = (propsValue) => ({ auth: { secret_text: token }, propsValue, files: { write: async () => 'test-file' } });
const success = { status: 200, headers: {}, body: { data: { id: 'test-record' } } };
afterEach(() => vi.restoreAllMocks());

describe('October 13 review regressions', () => {
  it.each(['createAutomation', 'createAutomationConnection', 'updateAutomation', 'updateAutomationConnection'])('sends a configured JSON body in native and guided %s', async (id) => {
    const body = { name: 'Configured automation', config: { enabled: false } };
    const action = famulor.actions()[id];
    expect(action.props.body).toBeDefined();
    const dynamic = await apiOperation.props.input.props({ operation: id });
    expect(dynamic.body).toBeDefined();
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(success);
    const values = { path_id: '00000000-0000-4000-8000-000000000001', body: JSON.stringify(body) };
    await action.run(context(values));
    expect(send.mock.lastCall[0].body).toEqual(body);
    await apiOperation.run(context({ operation: id, input: values }));
    expect(send.mock.lastCall[0].body).toEqual(body);
  });

  it.each([
    ['completeWhatsAppEmbeddedSignup', 'body_phone_number_id'],
    ['createMessagingConnector', 'body_phone_number_id'],
    ['getLoopRecording', 'query_call_id'],
    ['setLoopRecording', 'body_call_id'],
  ])('keeps the foreign resource ID in %s as text', async (id, key) => {
    expect(famulor.actions()[id].props[key].type).toBe('SHORT_TEXT');
    expect((await apiOperation.props.input.props({ operation: id }))[key].type).toBe('SHORT_TEXT');
  });

  it.each(['100', '-1'])('accepts scalar JSON %s through the real builder schema and sends its numeric value', async (input) => {
    const id = 'requestOutboundLimitIncrease';
    const action = famulor.actions()[id];
    const dynamic = await apiOperation.props.input.props({ operation: id });
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(success);
    for (const props of [action.props, dynamic]) {
      const property = props.body_requested_daily_limit;
      const processed = property.type === 'JSON' ? JSON.parse(input) : input;
      expect(piecePropertiesUtils.buildSchema({ requested: property }, undefined).safeParse({ requested: processed }).success).toBe(true);
    }
    const values = { body_requested_daily_limit: input, body_reason: 'Additional appointment reminders' };
    await action.run(context(values));
    expect(send.mock.lastCall[0].body.requested_daily_limit).toBe(Number(input));
    await apiOperation.run(context({ operation: id, input: values }));
    expect(send.mock.lastCall[0].body.requested_daily_limit).toBe(Number(input));
  });

  it.each(['600', '"now"'])('accepts the mixed scalar alternative %s', async (input) => {
    const action = famulor.actions().createResellerTaxRegistration;
    const prop = action.props.body_active_from;
    expect(prop.type).toBe('LONG_TEXT');
    expect(piecePropertiesUtils.buildSchema({ active: prop }, undefined).safeParse({ active: input }).success).toBe(true);
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(success);
    await action.run(context({ body_country: 'DE', body_registration_options: { type: 'standard' }, body_active_from: input, body_request_key: 'test-request-key' }));
    expect(send.mock.lastCall[0].body.active_from).toEqual(JSON.parse(input));
  });

  it('rejects malformed JSON before any HTTP request', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest');
    await expect(famulor.actions().createResellerTaxRegistration.run(context({ body_country: 'DE', body_registration_options: {}, body_active_from: '{broken', body_request_key: 'test-request-key' }))).rejects.toThrow('valid json');
    expect(send).not.toHaveBeenCalled();
  });

  it.each(operations.filter((operation) => operation.binary))('exposes the actual audio file output for $id', async (operation) => {
    const action = famulor.actions()[operation.id];
    expect(action.outputSchema.fields).toEqual([{ key: 'file', label: 'File' }]);
  });

  it('retains lifetime snapshot IDs while crossing the 512 KiB store-value limit', async () => {
    const definition = pollingDefinitions.find((item) => item.name === 'newCampaignLead');
    const record = { id: 'newly-acknowledged', created_at: new Date(2000).toISOString() };
    const item = { record, time: 0, key: `${definition.name}:${record.id}` };
    const key = famulorPolling.eventKey({ item, definition, generation: 'generation' });
    const bucket = parseInt(key.slice(0, 2), 16) % 32;
    const legacy = Array.from({ length: 7825 }, (_, index) => key.slice(0, 2) + index.toString(16).padStart(62, '0'));
    const values = new Map([['checkpoint', { started: 1000, time: 1000, generation: 'generation' }], [`baseline:${bucket}`, legacy], [`delivered:${key}`, true]]);
    const state = {
      get: async (name) => values.get(name),
      put: async (name, value) => {
        if (Buffer.byteLength(JSON.stringify(value)) > 512 * 1024) throw new Error('Store value exceeds 512 KiB');
        values.set(name, value);
      },
      delete: async (name) => values.delete(name),
    };
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ ...success, body: { data: [record] } });
    const trigger = pollingTriggers.find((item) => item.name === definition.name);
    const ctx = { store: state, auth: { secret_text: token }, propsValue: { campaign_id: '00000000-0000-4000-8000-000000000001' } };
    await expect(trigger.run(ctx)).resolves.toEqual([]);
    const root = values.get(`baseline:${bucket}`);
    const retained = Array.isArray(root) ? root : Array.from({ length: root.chunks }, (_, page) => values.get(`baseline:${bucket}:chunk:${page}`)).flat();
    expect(new Set(retained)).toEqual(new Set([...legacy, key]));
    values.delete(`delivered:${key}`);
    await expect(trigger.run(ctx)).resolves.toEqual([]);
    for (const value of values.values()) expect(Buffer.byteLength(JSON.stringify(value))).toBeLessThanOrEqual(512 * 1024);
  });

  it('preserves the legacy root and checkpoint after a failed chunk write, then retries', async () => {
    const definition = pollingDefinitions.find((item) => item.name === 'newCampaignLead');
    const record = { id: 'pending-chunk', created_at: new Date(2000).toISOString() };
    const key = famulorPolling.eventKey({ item: { record, time: 0, key: `${definition.name}:${record.id}` }, definition, generation: 'generation' });
    const bucket = parseInt(key.slice(0, 2), 16) % 32;
    const legacy = Array.from({ length: 7825 }, (_, index) => key.slice(0, 2) + index.toString(16).padStart(62, '0'));
    const checkpoint = { started: 1000, time: 1000, generation: 'generation' };
    const values = new Map([['checkpoint', checkpoint], [`baseline:${bucket}`, legacy], [`delivered:${key}`, true]]);
    let failed = false;
    const state = {
      get: async (name) => values.get(name),
      put: async (name, value) => {
        if (!failed && name === `baseline:${bucket}:chunk:1`) { failed = true; throw new Error('Temporary store failure'); }
        values.set(name, value);
      },
    };
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ ...success, body: { data: [record] } });
    const trigger = pollingTriggers.find((item) => item.name === definition.name);
    const ctx = { store: state, auth: { secret_text: token }, propsValue: { campaign_id: '00000000-0000-4000-8000-000000000001' } };
    await expect(trigger.run(ctx)).rejects.toThrow('Temporary store failure');
    expect(values.get(`baseline:${bucket}`)).toEqual(legacy);
    expect(values.get('checkpoint')).toEqual(checkpoint);
    await expect(trigger.run(ctx)).resolves.toEqual([]);
    values.delete(`delivered:${key}`);
    await expect(trigger.run(ctx)).resolves.toEqual([]);
  });

  it('fails closed on an incomplete chunked baseline without advancing state', async () => {
    const checkpoint = { started: 1000, time: 1000 };
    const put = vi.fn();
    const state = { get: async (name) => name === 'checkpoint' ? checkpoint : name === 'baseline:0' ? { chunks: 1 } : undefined, put };
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ ...success, body: { data: [] } });
    const trigger = pollingTriggers.find((item) => item.name === 'newCampaignLead');
    await expect(trigger.run({ store: state, auth: { secret_text: token }, propsValue: { campaign_id: '00000000-0000-4000-8000-000000000001' } })).rejects.toThrow('incomplete');
    expect(put).not.toHaveBeenCalled();
  });
});
