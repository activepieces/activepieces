import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { askDeepseek } from '../src/lib/actions/ask-deepseek';

const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('openai', () => ({
  default: vi.fn(function OpenAIMock() {
    return { chat: { completions: { create } } };
  }),
}));

const store = { get: vi.fn(), put: vi.fn(), delete: vi.fn() };

const BASE_PROPS: Record<string, unknown> = {
  model: 'deepseek-chat',
  prompt: 'Hi',
  maxTokens: 100,
  responseFormat: 'text',
};

const OK_REPLY = { choices: [{ message: { role: 'assistant', content: 'Hello' } }] };

function run({ props = {} }: { props?: Record<string, unknown> } = {}): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = askDeepseek.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(
    Reflect.apply(runFn, askDeepseek, [
      { ...base, propsValue: { ...BASE_PROPS, ...props }, auth: { secret_text: 'sk-test' }, store },
    ]),
  );
}

function sentMessages(): unknown {
  return create.mock.calls[0][0].messages;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('askDeepseek roles', () => {
  it.each([
    ['an empty object', {}],
    ['an empty string', ''],
    ['undefined', undefined],
  ])('sends no role messages for %s', async (_label, roles) => {
    create.mockResolvedValueOnce(OK_REPLY);
    await run({ props: { roles } });
    expect(sentMessages()).toEqual([{ role: 'user', content: 'Hi' }]);
  });

  it.each([
    ['an object', { role: 'system' }],
    ['an array of strings', ['x']],
  ])('rejects roles given as %s', async (_label, roles) => {
    await expect(run({ props: { roles } })).rejects.toThrow('Roles must be a JSON array of { role, content } objects.');
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a tool role', async () => {
    await expect(run({ props: { roles: [{ role: 'tool', content: 'x' }] } })).rejects.toThrow(
      'The only available roles are: [system, user, assistant]',
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('sends text-part content unchanged and null content as an empty string', async () => {
    create.mockResolvedValueOnce(OK_REPLY);
    await run({
      props: {
        roles: [
          { role: 'system', content: [{ type: 'text', text: 'Be brief' }] },
          { role: 'assistant', content: null },
        ],
      },
    });
    expect(sentMessages()).toEqual([
      { role: 'system', content: [{ type: 'text', text: 'Be brief' }] },
      { role: 'assistant', content: '' },
      { role: 'user', content: 'Hi' },
    ]);
  });
});

describe('askDeepseek memory', () => {
  it('strips reasoning_content from sent and saved messages', async () => {
    store.get.mockResolvedValueOnce([
      { role: 'user', content: 'Earlier' },
      { role: 'assistant', content: 'Answer', reasoning_content: 'x' },
    ]);
    create.mockResolvedValueOnce({
      choices: [{ message: { role: 'assistant', content: 'Hello', reasoning_content: 'thinking' } }],
    });
    await run({ props: { memoryKey: 'chat-1' } });
    expect(sentMessages()).toEqual([
      { role: 'user', content: 'Earlier' },
      { role: 'assistant', content: 'Answer' },
      { role: 'user', content: 'Hi' },
    ]);
    expect(store.put).toHaveBeenCalledTimes(1);
    expect(store.put.mock.calls[0][0]).toBe('chat-1');
    expect(store.put.mock.calls[0][1]).toEqual([
      { role: 'user', content: 'Earlier' },
      { role: 'assistant', content: 'Answer' },
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
    ]);
  });

  it('rejects an unreadable saved conversation without calling DeepSeek', async () => {
    store.get.mockResolvedValueOnce({ not: 'a list' });
    await expect(run({ props: { memoryKey: 'chat-1' } })).rejects.toThrow(
      'The conversation saved under this memory ID is unreadable. Use a new ID.',
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects an empty completion and saves nothing', async () => {
    store.get.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({ choices: [] });
    await expect(run({ props: { memoryKey: 'chat-1' } })).rejects.toThrow(
      'DeepSeek returned no reply. Try again or pick another model.',
    );
    expect(store.put).not.toHaveBeenCalled();
  });
});

describe('askDeepseek happy path', () => {
  it('returns the reply content and requests text format', async () => {
    create.mockResolvedValueOnce(OK_REPLY);
    const result = await run();
    expect(result).toBe('Hello');
    expect(create.mock.calls[0][0].response_format).toEqual({ type: 'text' });
    expect(store.get).not.toHaveBeenCalled();
    expect(store.put).not.toHaveBeenCalled();
  });

  it('requests json_object format when selected', async () => {
    create.mockResolvedValueOnce(OK_REPLY);
    await run({ props: { responseFormat: 'json_object' } });
    expect(create.mock.calls[0][0].response_format).toEqual({ type: 'json_object' });
  });
});
