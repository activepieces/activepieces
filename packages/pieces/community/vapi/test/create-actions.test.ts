import { httpClient } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAssistant } from '../src/lib/actions/create-assistant';
import { createFunctionTool } from '../src/lib/actions/create-function-tool';
import { createSquad } from '../src/lib/actions/create-squad';
import { placeCall } from '../src/lib/actions/place-call';

function run({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, action, [{ ...base, propsValue, auth: { secret_text: 'k' } }]));
}

function mockOk({ body }: { body: unknown }) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('create_assistant', () => {
  it('requires provider and model together', async () => {
    const spy = mockOk({ body: {} });
    await expect(run({ action: createAssistant, propsValue: { name: 'A', model: 'gpt-4o' } })).rejects.toThrow(
      'Model Provider and Model must be given together'
    );
    await expect(run({ action: createAssistant, propsValue: { name: 'A', voiceId: 'Elliot' } })).rejects.toThrow(
      'Voice Provider and Voice ID must be given together'
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('requires a model for a system prompt', async () => {
    const spy = mockOk({ body: {} });
    await expect(run({ action: createAssistant, propsValue: { name: 'A', systemPrompt: 'Be nice' } })).rejects.toThrow(
      'System Prompt requires Model Provider and Model'
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('sends the documented body', async () => {
    const spy = mockOk({ body: { id: 'a1', name: 'A' } });
    await run({
      action: createAssistant,
      propsValue: {
        name: ' A ',
        firstMessage: 'Hi',
        systemPrompt: 'Be nice',
        modelProvider: 'openai',
        model: 'gpt-4o',
        voiceProvider: 'vapi',
        voiceId: 'Elliot',
        endCallMessage: 'Bye',
      },
    });
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: 'POST',
      url: 'https://api.vapi.ai/assistant',
      body: {
        name: 'A',
        firstMessage: 'Hi',
        endCallMessage: 'Bye',
        model: { provider: 'openai', model: 'gpt-4o', messages: [{ role: 'system', content: 'Be nice' }] },
        voice: { provider: 'vapi', voiceId: 'Elliot' },
      },
    });
  });
});

describe('create_function_tool', () => {
  it('rejects an invalid function name', async () => {
    const spy = mockOk({ body: {} });
    await expect(
      run({ action: createFunctionTool, propsValue: { name: 'get order!', serverUrl: 'https://x.test' } })
    ).rejects.toThrow('Function Name may contain only');
    expect(spy).not.toHaveBeenCalled();
  });

  it('accepts only https server URLs', async () => {
    const spy = mockOk({ body: {} });
    await expect(
      run({ action: createFunctionTool, propsValue: { name: 'get_order', serverUrl: 'http://x.test' } })
    ).rejects.toThrow('https://');
    await expect(run({ action: createFunctionTool, propsValue: { name: 'get_order', serverUrl: 'nope' } })).rejects.toThrow(
      'valid URL'
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('sends a function tool body', async () => {
    const spy = mockOk({ body: { id: 't1', server: { url: 'https://x.test/hook', secret: 's' } } });
    const result = await run({
      action: createFunctionTool,
      propsValue: {
        name: 'get_order',
        description: 'Look up an order',
        parameters: { type: 'object', properties: { id: { type: 'string' } } },
        serverUrl: 'https://x.test/hook',
      },
    });
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: 'POST',
      url: 'https://api.vapi.ai/tool',
      body: {
        type: 'function',
        function: { name: 'get_order', description: 'Look up an order', parameters: { type: 'object', properties: { id: { type: 'string' } } } },
        server: { url: 'https://x.test/hook' },
      },
    });
    expect(result).toEqual({ id: 't1', server: { url: 'https://x.test/hook' } });
  });
});

describe('create_squad', () => {
  it('refuses an empty member list', async () => {
    const spy = mockOk({ body: {} });
    await expect(run({ action: createSquad, propsValue: { name: 'S', assistantIds: [' ', ''] } })).rejects.toThrow(
      'Add at least one Member Assistant ID'
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('accepts a JSON-string array and sends members in order', async () => {
    const spy = mockOk({ body: { id: 's1' } });
    await run({ action: createSquad, propsValue: { name: ' S ', assistantIds: '["a1"," a2 "]' } });
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: 'POST',
      url: 'https://api.vapi.ai/squad',
      body: { name: 'S', members: [{ assistantId: 'a1' }, { assistantId: 'a2' }] },
    });
  });

  it('rejects a value that is not a list', async () => {
    mockOk({ body: {} });
    await expect(run({ action: createSquad, propsValue: { name: 'S', assistantIds: 'a1' } })).rejects.toThrow(
      'must be a list of assistant IDs'
    );
    await expect(run({ action: createSquad, propsValue: { name: 'S', assistantIds: 5 } })).rejects.toThrow(
      'must be a list of assistant IDs'
    );
  });
});

describe('place_call', () => {
  it('sends trimmed IDs', async () => {
    const spy = mockOk({ body: { id: 'c1' } });
    await run({ action: placeCall, propsValue: { assistantId: ' a1 ', phoneNumberId: ' p1 ', customerNumber: '+14155551234' } });
    expect(spy.mock.calls[0][0].body).toMatchObject({ assistantId: 'a1', phoneNumberId: 'p1' });
  });
});
