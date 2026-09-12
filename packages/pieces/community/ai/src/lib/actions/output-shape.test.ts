import { httpClient } from '@activepieces/pieces-common';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateImageAction } from './image/generate-image';
import { askAI } from './text/ask-ai';
import { summarizeText } from './text/summarize-text';
import { classifyText } from './utility/classify-text';
import { extractStructuredData } from './utility/extract-structured-data';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    httpClient: { sendRequest: vi.fn(async () => ({ body: { requestId: 'request-1' } })) },
  };
});

const sendRequest = vi.mocked(httpClient.sendRequest);

const provider = { provider: 'openai', configId: 'config-1' };

function answered(answer: unknown, conversation?: unknown) {
  return { body: { output: { answer, conversation } } };
}

function requestBody(callIndex = 0): Record<string, unknown> {
  return sendRequest.mock.calls[callIndex][0].body as Record<string, unknown>;
}

beforeEach(() => {
  sendRequest.mockClear();
  sendRequest.mockResolvedValue({ body: { requestId: 'request-1' } } as never);
});

describe('the shape every AI action returns once the worker answers', () => {
  it('Ask AI returns the answer as a bare string', async () => {
    const output = await askAI.run(createMockActionContext({
      propsValue: { provider, model: 'gpt-test', prompt: 'weather?', webSearch: false, maxOutputTokens: 2000 },
      resumePayload: answered('sunny'),
    }));

    expect(output).toBe('sunny');
  });

  it('Ask AI returns text and sources together when web search asks for sources', async () => {
    const output = await askAI.run(createMockActionContext({
      propsValue: {
        provider,
        model: 'gpt-test',
        prompt: 'weather?',
        webSearch: true,
        webSearchOptions: { includeSources: true },
        maxOutputTokens: 2000,
      },
      resumePayload: answered({ text: 'sunny', sources: [{ id: 'source-1' }] }),
    }));

    expect(output).toEqual({ text: 'sunny', sources: [{ id: 'source-1' }] });
  });

  it('Summarize Text returns the summary as a bare string', async () => {
    const output = await summarizeText.run(createMockActionContext({
      propsValue: { provider, model: 'gpt-test', text: 'a long article', prompt: 'Summarize', maxOutputTokens: 2000 },
      resumePayload: answered('the short version'),
    }));

    expect(output).toBe('the short version');
  });

  it('Classify Text returns the chosen label as a bare string', async () => {
    const output = await classifyText.run(createMockActionContext({
      propsValue: { provider, model: 'gpt-test', text: 'it is warm today', categories: ['sunny', 'rainy'] },
      resumePayload: answered('sunny'),
    }));

    expect(output).toBe('sunny');
  });

  it('Extract Structured Data returns the extracted object itself', async () => {
    const output = await extractStructuredData.run(createMockActionContext({
      propsValue: {
        provider,
        model: 'gpt-test',
        text: 'an invoice totalling 42',
        mode: 'simple',
        schema: { fields: [{ name: 'total', type: 'number', isRequired: true }] },
        maxOutputTokens: 2000,
      },
      resumePayload: answered({ total: 42 }),
    }));

    expect(output).toEqual({ total: 42 });
  });

  it('Generate Image returns the stored file url as a bare string', async () => {
    const output = await generateImageAction.run(createMockActionContext({
      propsValue: { provider, model: 'dall-e-3', prompt: 'a cat', advancedOptions: {} },
      resumePayload: answered('test-file-url'),
    }));

    expect(output).toBe('test-file-url');
  });
});

describe('handing the step to the worker', () => {
  it('pauses the flow on the waitpoint it just created', async () => {
    const waitedOn: string[] = [];

    const output = await askAI.run(createMockActionContext({
      propsValue: { provider, model: 'gpt-test', prompt: 'weather?', webSearch: false, maxOutputTokens: 2000 },
      onWaitForWaitpoint: (waitpointId) => waitedOn.push(waitpointId),
    }));

    expect(output).toEqual({});
    expect(waitedOn).toEqual(['test-waitpoint-id']);
    expect(requestBody()['waitpointId']).toBe('test-waitpoint-id');
  });

  it('gives the waitpoint a backstop so a dead worker cannot hang the run forever', async () => {
    const created: { resumeDateTime?: string }[] = [];

    await askAI.run(createMockActionContext({
      propsValue: { provider, model: 'gpt-test', prompt: 'weather?', webSearch: false, maxOutputTokens: 2000 },
      onCreateWaitpoint: (waitpoint) => created.push(waitpoint),
    }));

    expect(created).toHaveLength(1);
    expect(new Date(created[0].resumeDateTime as string).getTime()).toBeGreaterThan(Date.now());
  });

  it('asks for the answer in the same request when the step cannot pause', async () => {
    sendRequest.mockResolvedValue(answered('sunny') as never);

    const output = await askAI.run(createMockActionContext({
      propsValue: { provider, model: 'gpt-test', prompt: 'weather?', webSearch: false, maxOutputTokens: 2000 },
      canPause: false,
    }));

    expect(output).toBe('sunny');
    expect(requestBody()['waitpointId']).toBeUndefined();
  });

  it('raises the failure the worker reported', async () => {
    await expect(askAI.run(createMockActionContext({
      propsValue: { provider, model: 'gpt-test', prompt: 'weather?', webSearch: false, maxOutputTokens: 2000 },
      resumePayload: { body: { failure: 'the model refused' } },
    }))).rejects.toThrow('the model refused');
  });

  it('raises a clear error when the backstop fires with nothing to report', async () => {
    await expect(askAI.run(createMockActionContext({
      propsValue: { provider, model: 'gpt-test', prompt: 'weather?', webSearch: false, maxOutputTokens: 2000 },
      resumePayload: { body: undefined },
    }))).rejects.toThrow('did not report a result');
  });
});

describe('what a saved flow sends over the wire', () => {
  it('turns categories saved as numbers into strings', async () => {
    await classifyText.run(createMockActionContext({
      propsValue: { provider, model: 'gpt-test', text: 'two', categories: [1, 2] },
    }));

    expect(requestBody()['categories']).toEqual(['1', '2']);
  });

  it('skips an empty file row instead of sending it', async () => {
    await extractStructuredData.run(createMockActionContext({
      propsValue: {
        provider,
        model: 'gpt-test',
        text: 'an invoice',
        files: [{ file: undefined }],
        mode: 'simple',
        schema: { fields: [] },
      },
    }));

    expect(requestBody()['files']).toEqual([]);
  });

  it('reads an Ask AI history stored in the legacy messages wrapper', async () => {
    const context = createMockActionContext({
      propsValue: { provider, model: 'gpt-test', prompt: 'and then?', conversationKey: 'thread-1', webSearch: false },
    });
    context.store.get = (async () => ({ messages: [{ role: 'user', content: 'hello' }] })) as typeof context.store.get;

    await askAI.run(context);

    expect(requestBody()['conversation']).toEqual([{ role: 'user', content: 'hello' }]);
  });

  it('still sends an input image pinned under the legacy advanced option', async () => {
    await generateImageAction.run(createMockActionContext({
      propsValue: {
        provider,
        model: 'gemini-2.5-flash-image',
        prompt: 'a cat',
        advancedOptions: { image: [{ file: { filename: 'cat.png', data: Buffer.from('png'), extension: 'png' } }] },
      },
    }));

    expect(requestBody()['files']).toEqual([{ fileId: 'test-file-id', mimeType: 'image/png', filename: 'cat.png' }]);
    expect(requestBody()['advancedOptions']).toEqual({});
  });

  it('turns a web search limit saved as text into the number the schema accepts', async () => {
    await askAI.run(createMockActionContext({
      propsValue: {
        provider,
        model: 'gpt-test',
        prompt: 'weather?',
        webSearch: true,
        webSearchOptions: { maxUses: '7', allowedDomains: ['example.com'] },
      },
    }));

    const webSearch = requestBody()['webSearch'] as { options: Record<string, unknown> };
    expect(webSearch.options['maxUses']).toBe(7);
    expect(webSearch.options['allowedDomains']).toEqual([{ domain: 'example.com' }]);
  });

  it('drops a stale Include Sources left behind by a provider that has no native search', async () => {
    await askAI.run(createMockActionContext({
      propsValue: {
        provider: { provider: 'openrouter', configId: 'config-1' },
        model: 'some/model',
        prompt: 'weather?',
        webSearch: true,
        webSearchOptions: { includeSources: true },
      },
    }));

    const webSearch = requestBody()['webSearch'] as { options: Record<string, unknown> };
    expect(webSearch.options).not.toHaveProperty('includeSources');
  });

  it('still runs an Extract whose only file row is empty, as it did before', async () => {
    await extractStructuredData.run(createMockActionContext({
      propsValue: {
        provider,
        model: 'gpt-test',
        files: [{ file: undefined }],
        mode: 'simple',
        schema: { fields: [] },
      },
    }));

    expect(requestBody()['files']).toEqual([]);
  });

  it('sends the creativity as a temperature the model understands', async () => {
    await askAI.run(createMockActionContext({
      propsValue: { provider, model: 'gpt-test', prompt: 'weather?', creativity: 50, webSearch: false },
    }));

    expect(requestBody()['temperature']).toBe(0.5);
  });
});
