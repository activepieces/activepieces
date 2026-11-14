import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { askGpt } from '../src/lib/actions/ask-gpt';

const { getChatCompletions } = vi.hoisted(() => ({ getChatCompletions: vi.fn() }));

vi.mock('@azure/openai', () => ({
  OpenAIClient: vi.fn(function OpenAIClientMock() {
    return { getChatCompletions };
  }),
  AzureKeyCredential: vi.fn(function AzureKeyCredentialMock() {
    return {};
  }),
}));

vi.mock('tiktoken', () => ({
  encoding_for_model: vi.fn(() => {
    throw new Error('unsupported');
  }),
}));

const SYSTEM_ROLE = { role: 'system', content: 'You are a helpful assistant.' };

const BASE_PROPS: Record<string, unknown> = {
  deploymentId: 'gpt-4o-prod',
  maxTokens: 2048,
  prompt: 'Hi',
  memoryKey: undefined,
  roles: undefined,
};

const storage = new Map<string, unknown>();

const store = {
  get: vi.fn(async (key: string) => storage.get(key) ?? null),
  put: vi.fn(async (key: string, value: unknown) => {
    storage.set(key, value);
    return value;
  }),
  delete: vi.fn(),
};

function reply({ content }: { content: string }) {
  return { choices: [{ message: { role: 'assistant', content } }] };
}

function run({ props = {} }: { props?: Record<string, unknown> } = {}): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = askGpt.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(
    Reflect.apply(runFn, askGpt, [
      {
        ...base,
        propsValue: { ...BASE_PROPS, ...props },
        auth: { props: { endpoint: 'https://example.openai.azure.com', apiKey: 'key' } },
        store,
      },
    ]),
  );
}

function sentMessages({ call }: { call: number }): unknown {
  return getChatCompletions.mock.calls[call][1];
}

beforeEach(() => {
  storage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('askGpt memory', () => {
  it('replays user and assistant messages on the second turn with the same memoryKey', async () => {
    getChatCompletions.mockResolvedValueOnce(reply({ content: 'reply1' }));
    getChatCompletions.mockResolvedValueOnce(reply({ content: 'reply2' }));
    const props = { memoryKey: 'chat-1', roles: [SYSTEM_ROLE] };

    const first = await run({ props: { ...props, prompt: 'first' } });
    const second = await run({ props: { ...props, prompt: 'second' } });

    expect(first).toBe('reply1');
    expect(second).toBe('reply2');
    expect(sentMessages({ call: 1 })).toEqual([
      SYSTEM_ROLE,
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'reply1' },
      { role: 'user', content: 'second' },
    ]);
    expect(storage.get('chat-1')).toEqual([
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'reply1' },
      { role: 'user', content: 'second' },
      { role: 'assistant', content: 'reply2' },
    ]);
  });

  it('repairs legacy string replies and drops null entries', async () => {
    storage.set('chat-1', ['old reply', null, { role: 'user', content: 'q' }]);
    getChatCompletions.mockResolvedValueOnce(reply({ content: 'ok' }));

    await run({ props: { memoryKey: 'chat-1', prompt: 'now' } });

    expect(sentMessages({ call: 0 })).toEqual([
      { role: 'assistant', content: 'old reply' },
      { role: 'user', content: 'q' },
      { role: 'user', content: 'now' },
    ]);
    expect(storage.get('chat-1')).toEqual([
      { role: 'assistant', content: 'old reply' },
      { role: 'user', content: 'q' },
      { role: 'user', content: 'now' },
      { role: 'assistant', content: 'ok' },
    ]);
  });

  it('starts fresh when the saved value is not a list', async () => {
    storage.set('chat-1', { not: 'a list' });
    getChatCompletions.mockResolvedValueOnce(reply({ content: 'ok' }));

    await run({ props: { memoryKey: 'chat-1' } });

    expect(sentMessages({ call: 0 })).toEqual([{ role: 'user', content: 'Hi' }]);
  });

  it('never touches the store without a memoryKey', async () => {
    getChatCompletions.mockResolvedValueOnce(reply({ content: 'plain' }));

    const result = await run();

    expect(result).toBe('plain');
    expect(store.get).not.toHaveBeenCalled();
    expect(store.put).not.toHaveBeenCalled();
  });
});

describe('askGpt roles', () => {
  it.each([
    ['an empty object', {}],
    ['an empty string', ''],
    ['undefined', undefined],
  ])('sends no role messages for %s', async (_label, roles) => {
    getChatCompletions.mockResolvedValueOnce(reply({ content: 'ok' }));
    await run({ props: { roles } });
    expect(sentMessages({ call: 0 })).toEqual([{ role: 'user', content: 'Hi' }]);
  });

  it.each([
    ['an object', { role: 'system' }],
    ['an array of strings', ['x']],
  ])('rejects roles given as %s', async (_label, roles) => {
    await expect(run({ props: { roles } })).rejects.toThrow('Roles must be a JSON array of { role, content } objects.');
    expect(getChatCompletions).not.toHaveBeenCalled();
  });

  it('rejects a tool role', async () => {
    await expect(run({ props: { roles: [{ role: 'tool', content: 'x' }] } })).rejects.toThrow(
      'The only available roles are: [system, user, assistant]',
    );
    expect(getChatCompletions).not.toHaveBeenCalled();
  });

  it('sends an empty string when a role has no content', async () => {
    getChatCompletions.mockResolvedValueOnce(reply({ content: 'ok' }));
    await run({ props: { roles: [{ role: 'system' }] } });
    expect(sentMessages({ call: 0 })).toEqual([
      { role: 'system', content: '' },
      { role: 'user', content: 'Hi' },
    ]);
  });
});

describe('askGpt replies and validation', () => {
  it('rejects empty choices and saves nothing', async () => {
    getChatCompletions.mockResolvedValueOnce({ choices: [] });
    await expect(run({ props: { memoryKey: 'chat-1' } })).rejects.toThrow(
      'Azure OpenAI returned no reply. Check the deployment name and try again.',
    );
    expect(store.put).not.toHaveBeenCalled();
  });

  it('accepts a temperature of 1.5', async () => {
    getChatCompletions.mockResolvedValueOnce(reply({ content: 'ok' }));
    await expect(run({ props: { temperature: 1.5 } })).resolves.toBe('ok');
    expect(getChatCompletions.mock.calls[0][2].temperature).toBe(1.5);
  });

  it('rejects a temperature of 2.5 without calling Azure', async () => {
    await expect(run({ props: { temperature: 2.5 } })).rejects.toThrow();
    expect(getChatCompletions).not.toHaveBeenCalled();
  });
});
