import { describe, expect, it, vi, beforeEach } from 'vitest';

const create = vi.fn();
vi.mock('openai', () => ({
  default: vi.fn(function () {
    return { chat: { completions: { create } } };
  }),
}));

import { createMockActionContext } from '@activepieces/pieces-framework';
import {
  isRetiredModel,
  modelTokenLimit,
  resolveModelId,
  samplingParams,
} from '../src/lib/common/common';
import { askOpenAI } from '../src/lib/actions/send-prompt';
import { analyzeSentiment } from '../src/lib/actions/analyze-sentiment';
import { extractStructuredDataAction } from '../src/lib/actions/extract-structure-data.action';
import { openai } from '../src/index';

const RETIRED: Array<[string, string]> = [
  ['gpt-5', 'gpt-6.1-sol'],
  ['gpt-5-2025-08-07', 'gpt-6.1-sol'],
  ['gpt-5-pro', 'gpt-6.1-sol'],
  ['gpt-5-pro-2025-10-06', 'gpt-6.1-sol'],
  ['gpt-5-mini', 'gpt-6.1-terra'],
  ['gpt-5-mini-2025-08-07', 'gpt-6.1-terra'],
  ['gpt-5-nano', 'gpt-6-luna'],
  ['gpt-5-nano-2025-08-07', 'gpt-6-luna'],
  ['gpt-5.4-nano', 'gpt-6-luna'],
  ['gpt-5.4-nano-2026-03-17', 'gpt-6-luna'],
  ['gpt-5.1', 'gpt-6-sol'],
  ['gpt-5.1-2025-11-13', 'gpt-6-sol'],
  ['gpt-5.3-codex', 'gpt-6-sol'],
];

const auth = { type: 'SECRET_TEXT', secret_text: 'sk-test' };

const completion = {
  model: 'x',
  choices: [{ message: { role: 'assistant', content: '{"sentiment":"positive","confidence":0.9,"explanation":"ok"}', tool_calls: [{ function: { arguments: '{"name":"a"}' } }] } }],
};

describe('resolveModelId', () => {
  it('maps every retired id to its replacement', () => {
    for (const [retired, replacement] of RETIRED) {
      expect(resolveModelId(retired)).toBe(replacement);
      expect(isRetiredModel(retired)).toBe(true);
    }
  });
  it('keeps current ids unchanged', () => {
    for (const id of ['gpt-4o', 'gpt-4.1-mini', 'gpt-6.1-sol', 'gpt-5-chat-latest', 'gpt-5.4']) {
      expect(resolveModelId(id)).toBe(id);
      expect(isRetiredModel(id)).toBe(false);
    }
  });
  it('ignores inherited object keys', () => {
    for (const id of ['constructor', 'toString', '__proto__']) {
      expect(resolveModelId(id)).toBe(id);
      expect(isRetiredModel(id)).toBe(false);
    }
  });
  it('gives retired ids and their replacements the large context limit', () => {
    for (const [retired, replacement] of RETIRED) {
      expect(modelTokenLimit(retired)).toBe(400000);
      expect(modelTokenLimit(replacement)).toBe(400000);
    }
    expect(modelTokenLimit('gpt-5-chat-latest')).toBe(400000);
    expect(modelTokenLimit('gpt-4')).toBe(8192);
    expect(modelTokenLimit('gpt-5.4')).toBe(2048);
    expect(modelTokenLimit('o3-mini')).toBe(2048);
    expect(modelTokenLimit('gpt-6.1-sol-2026-10-01')).toBe(400000);
  });
  it('drops sampling params for retired ids and the gpt-6 replacements', () => {
    for (const id of [...RETIRED.map(([retired]) => retired), 'gpt-6.1-sol', 'gpt-6-luna', 'gpt-6.1-sol-2026-10-01']) {
      expect(samplingParams({ selectedModel: id, temperature: 0.2, topP: 1, frequencyPenalty: 0 })).toEqual({});
    }
    for (const [retired] of RETIRED) {
      expect(samplingParams({ selectedModel: retired, temperature: 1, topP: 1, frequencyPenalty: 0 })).toEqual({});
    }
    for (const id of ['gpt-5.4', 'o3-mini', 'gpt-4o']) {
      expect(samplingParams({ selectedModel: id, temperature: 0.2, topP: 1, frequencyPenalty: 0, presencePenalty: null })).toEqual({
        temperature: 0.2,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: undefined,
      });
    }
  });
});

describe('actions send the replacement model', () => {
  beforeEach(() => {
    create.mockReset();
    create.mockResolvedValue(completion);
  });

  it('ask_chatgpt runs a retired id on its replacement without sampling params', async () => {
    await askOpenAI.run({ ...createMockActionContext({ propsValue: { model: 'gpt-5-mini', prompt: 'hi', maxTokens: 100, temperature: 1, topP: 1, frequencyPenalty: 0, roles: [] } }), auth });
    const body = create.mock.calls[0][0];
    expect(body.model).toBe('gpt-6.1-terra');
    expect(body.max_completion_tokens).toBe(100);
    expect(body).not.toHaveProperty('temperature');
    expect(body).not.toHaveProperty('top_p');
    expect(body).not.toHaveProperty('frequency_penalty');
  });

  it('ask_chatgpt leaves a current non-reasoning model untouched', async () => {
    await askOpenAI.run({ ...createMockActionContext({ propsValue: { model: 'gpt-4o', prompt: 'hi', maxTokens: 100, temperature: 0.5, topP: 1, frequencyPenalty: 0, roles: [] } }), auth });
    const body = create.mock.calls[0][0];
    expect(body.model).toBe('gpt-4o');
    expect(body.temperature).toBe(0.5);
  });

  it('analyze_sentiment keeps temperature 0 for a current model', async () => {
    await analyzeSentiment.run({ ...createMockActionContext({ propsValue: { model: 'gpt-4o-mini', text: 'great' } }), auth });
    const body = create.mock.calls[0][0];
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.temperature).toBe(0);
  });

  it('ask_chatgpt keeps params for current reasoning-family ids', async () => {
    for (const model of ['gpt-5.4', 'o3-mini']) {
      create.mockClear();
      await askOpenAI.run({ ...createMockActionContext({ propsValue: { model, prompt: 'hi', maxTokens: 100, temperature: 0.2, topP: 1, frequencyPenalty: 0, roles: [] } }), auth });
      const body = create.mock.calls[0][0];
      expect(body.model).toBe(model);
      expect(body.temperature).toBe(0.2);
      expect(body.top_p).toBe(1);
      expect(body.frequency_penalty).toBe(0);
    }
  });

  it('analyze_sentiment resolves the model', async () => {
    await analyzeSentiment.run({ ...createMockActionContext({ propsValue: { model: 'gpt-5-nano', text: 'great' } }), auth });
    const body = create.mock.calls[0][0];
    expect(body.model).toBe('gpt-6-luna');
    expect(body).not.toHaveProperty('temperature');
  });

  it('extract structured data resolves the model', async () => {
    await extractStructuredDataAction.run({ ...createMockActionContext({ propsValue: { model: 'gpt-5.1', text: 'a', params: [{ propName: 'name', propDataType: 'string', propIsRequired: false }] } }), auth });
    const body = create.mock.calls[0][0];
    expect(body.model).toBe('gpt-6-sol');
    expect(body.reasoning_effort).toBe('none');
  });

  it('extract structured data uses json_schema for gpt-6.1-sol', async () => {
    create.mockResolvedValue({ choices: [{ message: { role: 'assistant', content: '{"name":"Ann"}' } }] });
    const result = await extractStructuredDataAction.run({ ...createMockActionContext({ propsValue: { model: 'gpt-5', text: 'Ann', params: [{ propName: 'name', propDataType: 'string', propIsRequired: true }] } }), auth });
    const body = create.mock.calls[0][0];
    expect(body.model).toBe('gpt-6.1-sol');
    expect(body).not.toHaveProperty('tools');
    expect(body).not.toHaveProperty('reasoning_effort');
    expect(body.response_format).toEqual({
      type: 'json_schema',
      json_schema: {
        name: 'extract_structured_data',
        schema: { type: 'object', properties: { name: { type: 'string', description: 'name' } }, required: ['name'] },
        strict: false,
      },
    });
    expect(result).toEqual({ name: 'Ann' });
  });

  it('extract structured data reports the refusal on the json_schema path', async () => {
    create.mockResolvedValue({ choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: null, refusal: 'I cannot help with that.' } }] });
    await expect(
      extractStructuredDataAction.run({ ...createMockActionContext({ propsValue: { model: 'gpt-5', text: 'x', params: [{ propName: 'name', propDataType: 'string', propIsRequired: true }] } }), auth }),
    ).rejects.toThrow('I cannot help with that.');
  });

  it('extract structured data returns the same shape on the tools path', async () => {
    const result = await extractStructuredDataAction.run({ ...createMockActionContext({ propsValue: { model: 'gpt-6-luna', text: 'a', params: [{ propName: 'name', propDataType: 'string', propIsRequired: false }] } }), auth });
    expect(create.mock.calls[0][0].tools).toHaveLength(1);
    expect(result).toEqual({ name: 'a' });
  });

  it('extract structured data sends no reasoning_effort for gpt-4o-mini', async () => {
    await extractStructuredDataAction.run({ ...createMockActionContext({ propsValue: { model: 'gpt-4o-mini', text: 'a', params: [{ propName: 'name', propDataType: 'string', propIsRequired: false }] } }), auth });
    const body = create.mock.calls[0][0];
    expect(body.model).toBe('gpt-4o-mini');
    expect(body).not.toHaveProperty('reasoning_effort');
  });
});

describe('piece registration', () => {
  it('registers the actions that resolve retired models', () => {
    const names = Object.keys(openai.actions());
    expect(names).toEqual(expect.arrayContaining(['ask_chatgpt', 'analyze_sentiment', 'extract-structured-data']));
  });
});
