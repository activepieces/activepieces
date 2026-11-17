import { httpClient } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { vapi } from '../src/index';
import { vapiFlatten } from '../src/lib/common/flatten';
import { placeCall } from '../src/lib/actions/place-call';
import { createCall } from '../src/lib/actions/create-call';
import { getCallResult } from '../src/lib/actions/get-call-result';
import { getCall } from '../src/lib/actions/get-call';
import { listCalls } from '../src/lib/actions/list-calls';
import { listPhoneNumbers } from '../src/lib/actions/list-phone-numbers';
import { getTool } from '../src/lib/actions/get-tool';
import { updatePhoneNumber } from '../src/lib/actions/update-phone-number';
import { uploadFile, uploadFileInternals } from '../src/lib/actions/upload-file';
import { deleteCall } from '../src/lib/actions/delete-call';
import { updateAssistantSettings } from '../src/lib/actions/update-assistant-settings';
import { HttpError } from '@activepieces/pieces-common';
import FormData from 'form-data';

const AUTH = { secret_text: 'key-1' };

function run({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, action, [{ ...base, propsValue, auth: AUTH }]));
}

function mockOk({ body }: { body: unknown }) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

const endedCall = {
  id: 'c1',
  status: 'ended',
  endedReason: 'customer-ended-call',
  assistantId: 'a1',
  phoneNumberId: 'p1',
  customer: { number: '+14155551234' },
  startedAt: '2026-11-17T10:00:00.000Z',
  endedAt: '2026-11-17T10:01:30.000Z',
  cost: 0.12,
  artifact: { transcript: 'AI: hi', recordingUrl: 'https://r.test/a.wav', messages: [{ role: 'bot' }] },
  analysis: { summary: 'short', successEvaluation: 'true' },
  createdAt: '2026-11-17T09:59:58.000Z',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('piece metadata', () => {
  it('has one agent-visible action per job and aiMetadata on every agent-visible action', () => {
    const actions = Object.values(vapi.actions());
    const agentVisible = actions.filter((action) => action.audience === 'ai' || action.audience === 'both');
    expect(agentVisible.map((action) => action.name).sort()).toEqual(
      [
        'create_assistant',
        'find_assistant',
        'find_calls',
        'find_file',
        'find_phone_number',
        'find_squad',
        'find_tool',
        'get_assistant',
        'get_call_result',
        'get_file',
        'get_phone_number',
        'get_squad',
        'get_tool',
        'place_call',
        'update_assistant_settings',
        'update_phone_number',
      ].sort()
    );
    for (const action of agentVisible) {
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
    }
    for (const name of ['create_call', 'get_call', 'update_assistant']) {
      expect(vapi.actions()[name].audience).toBe('human');
    }
  });

  it('every action except Custom API Call has an outputSchema', () => {
    for (const action of Object.values(vapi.actions())) {
      if (action.name === 'custom_api_call') continue;
      expect(action.outputSchema, action.name).toBeDefined();
    }
  });
});

describe('flatteners', () => {
  it('callResult returns only the flat fields with duration', () => {
    expect(vapiFlatten.callResult(endedCall)).toEqual({
      id: 'c1',
      status: 'ended',
      endedReason: 'customer-ended-call',
      startedAt: '2026-11-17T10:00:00.000Z',
      endedAt: '2026-11-17T10:01:30.000Z',
      durationSeconds: 90,
      cost: 0.12,
      summary: 'short',
      transcript: 'AI: hi',
      recordingUrl: 'https://r.test/a.wav',
      successEvaluation: 'true',
    });
  });

  it('callResult tolerates a call that has not started', () => {
    const result = vapiFlatten.callResult({ id: 'c2', status: 'queued' });
    expect(result.durationSeconds).toBeNull();
    expect(result.transcript).toBeNull();
  });

  it('squadSummary lists member assistant IDs', () => {
    expect(vapiFlatten.squadSummary({ id: 's', name: 'S', members: [{ assistantId: 'a1' }, { assistant: {} }] })).toEqual({
      id: 's',
      name: 'S',
      memberAssistantIds: ['a1'],
    });
  });
});

describe('place_call', () => {
  it('sends customer, overrides and variable values and returns the flat call', async () => {
    const spy = mockOk({ body: { ...endedCall, status: 'queued' } });
    const result = await run({
      action: placeCall,
      propsValue: {
        assistantId: 'a1',
        phoneNumberId: 'p1',
        customerNumber: ' +14155551234 ',
        customerName: 'Jane',
        firstMessage: 'Hello',
        variableValues: '{"orderId":"9"}',
      },
    });
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: 'POST',
      url: 'https://api.vapi.ai/call',
      body: {
        assistantId: 'a1',
        phoneNumberId: 'p1',
        customer: { number: '+14155551234', name: 'Jane' },
        assistantOverrides: { firstMessage: 'Hello', variableValues: { orderId: '9' } },
      },
    });
    expect(result).toEqual({
      id: 'c1',
      status: 'queued',
      assistantId: 'a1',
      phoneNumberId: 'p1',
      customerNumber: '+14155551234',
      createdAt: '2026-11-17T09:59:58.000Z',
    });
  });

  it('rejects a non-E.164 number before calling Vapi', async () => {
    const spy = mockOk({ body: {} });
    await expect(
      run({ action: placeCall, propsValue: { assistantId: 'a1', phoneNumberId: 'p1', customerNumber: '4155551234' } })
    ).rejects.toThrow('E.164');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('create_call', () => {
  it('keeps the original props and refuses a non-object override', async () => {
    const spy = mockOk({ body: endedCall });
    await run({
      action: createCall,
      propsValue: { assistantId: 'a1', phoneNumberId: 'p1', customerNumber: '+14155551234', name: 'n', assistantOverrides: { firstMessage: 'x' } },
    });
    expect(spy.mock.calls[0][0].body).toEqual({
      assistantId: 'a1',
      phoneNumberId: 'p1',
      customer: { number: '+14155551234' },
      name: 'n',
      assistantOverrides: { firstMessage: 'x' },
    });
    await expect(
      run({ action: createCall, propsValue: { assistantId: 'a1', phoneNumberId: 'p1', customerNumber: '+1', assistantOverrides: [1] } })
    ).rejects.toThrow('Assistant Overrides must be a JSON object');
  });
});

describe('reads and lists', () => {
  it('get_call_result flattens the call', async () => {
    mockOk({ body: endedCall });
    const result = await run({ action: getCallResult, propsValue: { callId: 'c1' } });
    expect(Object.keys(result ?? {}).sort()).toEqual(
      ['cost', 'durationSeconds', 'endedAt', 'endedReason', 'id', 'recordingUrl', 'startedAt', 'status', 'successEvaluation', 'summary', 'transcript'].sort()
    );
  });

  it('list_calls wraps the bare array and sends filters', async () => {
    const spy = mockOk({ body: [endedCall] });
    const result = await run({
      action: listCalls,
      propsValue: { assistantId: 'a1', createdAfter: '2026-11-01T00:00:00Z', limit: 5 },
    });
    expect(result).toEqual({ calls: [endedCall] });
    expect(spy.mock.calls[0][0].queryParams).toEqual({ assistantId: 'a1', createdAtGt: '2026-11-01T00:00:00.000Z', limit: '5' });
  });

  it('get_call omits empty-string customer and name from web calls', async () => {
    mockOk({ body: { id: 'w1', type: 'webCall', customer: '', name: '', status: 'ended' } });
    const result = await run({ action: getCall, propsValue: { callId: 'w1' } });
    expect(result).toEqual({ id: 'w1', type: 'webCall', status: 'ended' });
  });

  it('list_phone_numbers wraps the array and strips provider secrets', async () => {
    mockOk({ body: [{ id: 'p1', number: '+1', provider: 'twilio', twilioAuthToken: 'secret' }] });
    const result = await run({ action: listPhoneNumbers, propsValue: {} });
    expect(result).toEqual({ phoneNumbers: [{ id: 'p1', number: '+1', provider: 'twilio' }] });
  });

  it('get_tool strips the server secret', async () => {
    mockOk({ body: { id: 't1', type: 'function', server: { url: 'https://x.test', secret: 'abc' } } });
    const result = await run({ action: getTool, propsValue: { toolId: 't1' } });
    expect(result).toEqual({ id: 't1', type: 'function', server: { url: 'https://x.test' } });
  });

  it('update_phone_number refuses both assistant and squad', async () => {
    const spy = mockOk({ body: {} });
    await expect(
      run({ action: updatePhoneNumber, propsValue: { phoneNumberId: 'p1', assistantId: 'a1', squadId: 's1' } })
    ).rejects.toThrow('not both');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('upload_file', () => {
  it('maps extensions to MIME types and rejects unknown ones', () => {
    expect(uploadFileInternals.mimeTypeFor({ filename: 'notes.TXT' })).toBe('text/plain');
    expect(uploadFileInternals.mimeTypeFor({ filename: 'blob', extension: 'pdf' })).toBe('application/pdf');
    expect(uploadFileInternals.mimeTypeFor({ filename: 'a.yml' })).toBe('text/yaml');
    expect(() => uploadFileInternals.mimeTypeFor({ filename: 'a.exe' })).toThrow('Vapi accepts: .txt');
  });

  it('sends a form-data body with filename and content type', async () => {
    const spy = mockOk({ body: { id: 'f1' } });
    await run({ action: uploadFile, propsValue: { file: { filename: 'kb.md', extension: 'md', data: Buffer.from('# hi') } } });
    const request = spy.mock.calls[0][0];
    expect(request.body).toBeInstanceOf(FormData);
    const raw = request.body instanceof FormData ? request.body.getBuffer().toString() : '';
    expect(raw).toContain('filename="kb.md"');
    expect(raw).toContain('Content-Type: text/markdown');
    expect(request.headers?.['content-type']).toMatch(/^multipart\/form-data; boundary=/);
    expect(request.headers?.['Authorization']).toBe('Bearer key-1');
  });
});

describe('file bytes', () => {
  it('reads numeric-string bytes', () => {
    expect(vapiFlatten.fileSummary({ id: 'f', bytes: '20' }).bytes).toBe(20);
    expect(vapiFlatten.fileSummary({ id: 'f', bytes: 'abc' }).bytes).toBeNull();
  });
});

describe('delete_call', () => {
  it('maps Vapi 400 "Call not found" to a clear error', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 400, responseBody: { message: 'Call not found', statusCode: 400 } })
    );
    await expect(run({ action: deleteCall, propsValue: { callId: 'c1' } })).rejects.toThrow('call c1 not found');
  });
});

describe('update_assistant_settings', () => {
  it('returns the system prompt it set', async () => {
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { id: 'a1', model: { provider: 'openai', model: 'gpt-4o' } } })
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        body: { id: 'a1', name: 'A', model: { provider: 'openai', model: 'gpt-4o', messages: [{ role: 'system', content: 'new' }] } },
      });
    const result = await run({ action: updateAssistantSettings, propsValue: { assistantId: 'a1', systemPrompt: 'new' } });
    expect(result).toMatchObject({ id: 'a1', systemPrompt: 'new', provider: 'openai' });
  });
});
