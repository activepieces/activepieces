import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createChatCompletionAction } from '../src/lib/actions/create-chat-completion.action';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) },
  };
});

beforeEach(() => {
  sendRequest.mockReset();
  sendRequest.mockResolvedValue({
    status: 200,
    headers: {},
    body: { choices: [{ message: { content: 'answer' } }], citations: ['https://example.com'] },
  });
});

describe('Ask AI', () => {
  it('sends Maximum Tokens when it is set', async () => {
    await runAskAi({ max_tokens: 256 });
    expect(requestBody()).toMatchObject({ max_tokens: 256 });
  });

  it('leaves Maximum Tokens out of the request when it is empty', async () => {
    await runAskAi({ max_tokens: undefined });
    await runAskAi({ max_tokens: null });
    expect(requestBody(0)).not.toHaveProperty('max_tokens');
    expect(requestBody(1)).not.toHaveProperty('max_tokens');
  });

  it('rejects a Maximum Tokens value that is not a positive whole number', async () => {
    for (const max_tokens of [0, -5, 2.5]) {
      await expect(runAskAi({ max_tokens })).rejects.toThrow('max_tokens');
    }
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('returns the answer and its citations', async () => {
    await expect(runAskAi({})).resolves.toEqual({ result: 'answer', citations: ['https://example.com'] });
  });
});

function runAskAi(overrides: Record<string, unknown>): Promise<unknown> {
  const propsValue = {
    model: 'sonar-pro',
    prompt: 'What is new today?',
    temperature: 0.2,
    top_p: 0.9,
    presence_penalty: 0,
    frequency_penalty: 1,
    roles: [{ role: 'system', content: 'You are a helpful assistant.' }],
    ...overrides,
  };
  return Promise.resolve(
    Reflect.apply(createChatCompletionAction.run, createChatCompletionAction, [
      { propsValue, auth: { secret_text: 'test-key' } },
    ]),
  );
}

function requestBody(index = 0): unknown {
  return sendRequest.mock.calls[index][0].body;
}
