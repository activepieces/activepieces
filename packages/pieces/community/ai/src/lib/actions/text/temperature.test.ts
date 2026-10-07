import { httpClient } from '@activepieces/pieces-common';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { askAI } from './ask-ai';
import { summarizeText } from './summarize-text';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    httpClient: { sendRequest: vi.fn(async () => ({ body: { requestId: 'request-1' } })) },
  };
});

const sendRequest = vi.mocked(httpClient.sendRequest);

const baseProps = {
  provider: { provider: 'openai', configId: 'config1' },
  model: 'gpt-test',
  maxOutputTokens: 2000,
};

async function askAiRequestBody({ creativity }: { creativity: number | null | undefined }) {
  await askAI.run(createMockActionContext({
    propsValue: { ...baseProps, prompt: 'hello', webSearch: false, creativity },
  }));
  return sendRequest.mock.calls[0][0].body as Record<string, unknown>;
}

beforeEach(() => {
  sendRequest.mockClear();
});

describe('askAI temperature', () => {
  it('omits temperature when creativity is not set', async () => {
    const body = await askAiRequestBody({ creativity: undefined });
    expect(body).not.toHaveProperty('temperature');
  });

  it('omits temperature when creativity is null', async () => {
    const body = await askAiRequestBody({ creativity: null });
    expect(body).not.toHaveProperty('temperature');
  });

  it('sends temperature scaled from an explicit creativity', async () => {
    const body = await askAiRequestBody({ creativity: 50 });
    expect(body['temperature']).toBe(0.5);
  });

  it('sends temperature 1 for the previously seeded default of 100', async () => {
    const body = await askAiRequestBody({ creativity: 100 });
    expect(body['temperature']).toBe(1);
  });

  it('sends temperature 0 when creativity is 0', async () => {
    const body = await askAiRequestBody({ creativity: 0 });
    expect(body['temperature']).toBe(0);
  });
});

describe('summarizeText temperature', () => {
  it('sends no temperature', async () => {
    await summarizeText.run(createMockActionContext({
      propsValue: { ...baseProps, text: 'long text', prompt: 'Summarize' },
    }));
    expect(sendRequest.mock.calls[0][0].body).not.toHaveProperty('temperature');
  });
});
