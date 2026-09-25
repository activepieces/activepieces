import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateEmbeddings } from '../src/lib/actions/generate-embeddings';
import { generateChatCompletion } from '../src/lib/actions/generate-chat-completion';
import { hfInference } from '../src/lib/common/inference';
import { StaticPropsValue } from '@activepieces/pieces-framework';
import { runAction, TEST_TOKEN } from './helpers';

const featureExtraction = vi.fn();
const chatCompletion = vi.fn();
const clientTokens: string[] = [];

vi.mock('@huggingface/inference', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@huggingface/inference')>();
  return {
    ...actual,
    InferenceClient: class {
      constructor(token: string) {
        clientTokens.push(token);
      }
      featureExtraction = (...args: unknown[]) => featureExtraction(...args);
      chatCompletion = (...args: unknown[]) => chatCompletion(...args);
    },
  };
});

function runEmbeddings(overrides: Partial<StaticPropsValue<typeof generateEmbeddings.props>>) {
  return runAction({
    action: generateEmbeddings,
    propsValue: {
      model: 'BAAI/bge-small-en-v1.5',
      provider: undefined,
      inputs: [],
      normalize: undefined,
      truncate: undefined,
      truncation_direction: undefined,
      prompt_name: undefined,
      ...overrides,
    },
  });
}

function runChat(overrides: Partial<StaticPropsValue<typeof generateChatCompletion.props>>) {
  return runAction({
    action: generateChatCompletion,
    propsValue: {
      model: undefined,
      provider: undefined,
      messages: JSON.parse('[{"role": "user", "content": "Hi"}]'),
      system_prompt: undefined,
      max_tokens: undefined,
      temperature: undefined,
      top_p: undefined,
      stop: undefined,
      seed: undefined,
      response_format: undefined,
      json_schema: undefined,
      ...overrides,
    },
  });
}

beforeEach(() => {
  featureExtraction.mockReset();
  chatCompletion.mockReset();
  clientTokens.length = 0;
});

describe('generate_embeddings shape handling', () => {
  it('returns a flat vector for one text as the embedding', async () => {
    featureExtraction.mockResolvedValueOnce([0.1, 0.2, 0.3]);

    const result = await runEmbeddings({ inputs: ['hello'] });

    expect(result).toEqual({ model: 'BAAI/bge-small-en-v1.5', embedding: [0.1, 0.2, 0.3], dimensions: 3 });
    expect(featureExtraction.mock.calls[0][0].inputs).toBe('hello');
    expect(clientTokens).toEqual([TEST_TOKEN]);
  });

  it('unwraps a single pooled vector wrapped in an outer array', async () => {
    featureExtraction.mockResolvedValueOnce([[0.5, 0.6]]);

    const result = await runEmbeddings({ inputs: ['hello'] });

    expect(result).toEqual({ model: 'BAAI/bge-small-en-v1.5', embedding: [0.5, 0.6], dimensions: 2 });
  });

  it('rejects token-level vectors for one text instead of returning the first token', async () => {
    featureExtraction.mockResolvedValueOnce([
      [0.1, 0.2],
      [0.3, 0.4],
      [0.5, 0.6],
    ]);

    await expect(runEmbeddings({ inputs: ['hello world'] })).rejects.toThrow(/token-level vectors/);
  });

  it('rejects token-level vectors for one text wrapped in a batch array', async () => {
    featureExtraction.mockResolvedValueOnce([
      [
        [0.1, 0.2],
        [0.3, 0.4],
      ],
    ]);

    await expect(runEmbeddings({ inputs: ['hello world'] })).rejects.toThrow(/token-level vectors/);
  });

  it('returns one pooled vector per text, in order, for several texts', async () => {
    featureExtraction.mockResolvedValueOnce([
      [1, 2],
      [3, 4],
    ]);

    const result = await runEmbeddings({ inputs: ['a', 'b'] });

    expect(result).toEqual({
      model: 'BAAI/bge-small-en-v1.5',
      embeddings: [
        [1, 2],
        [3, 4],
      ],
      count: 2,
      dimensions: 2,
    });
    expect(featureExtraction.mock.calls[0][0].inputs).toEqual(['a', 'b']);
  });

  it('rejects token-level vectors for several texts with the same typed error', async () => {
    featureExtraction.mockResolvedValueOnce([
      [
        [1, 2],
        [3, 4],
      ],
      [
        [5, 6],
        [7, 8],
      ],
    ]);

    await expect(runEmbeddings({ inputs: ['a', 'b'] })).rejects.toThrow(/token-level vectors/);
  });

  it('rejects a result whose count does not match the number of texts', async () => {
    featureExtraction.mockResolvedValueOnce([[1, 2]]);

    await expect(runEmbeddings({ inputs: ['a', 'b'] })).rejects.toThrow(/one pooled embedding per text/);
  });

  it('rejects empty input before calling the provider', async () => {
    await expect(runEmbeddings({ inputs: ['  '] })).rejects.toThrow(/at least one non-empty text/);
    expect(featureExtraction).not.toHaveBeenCalled();
  });
});

describe('resolveModelAndProvider', () => {
  it('falls back to the default model when the model is empty', () => {
    expect(hfInference.resolveModelAndProvider({ model: '  ', provider: undefined, defaultModel: 'openai/gpt-oss-20b' })).toEqual({
      model: 'openai/gpt-oss-20b',
      provider: undefined,
    });
  });

  it('keeps a model without a suffix and uses the selected provider', () => {
    expect(hfInference.resolveModelAndProvider({ model: 'Qwen/Qwen3-8B', provider: 'groq' })).toEqual({
      model: 'Qwen/Qwen3-8B',
      provider: 'groq',
    });
  });

  it('turns a :groq suffix into the provider', () => {
    expect(hfInference.resolveModelAndProvider({ model: 'Qwen/Qwen3-8B:groq', provider: undefined })).toEqual({
      model: 'Qwen/Qwen3-8B',
      provider: 'groq',
    });
  });

  it('maps :preferred to the auto policy', () => {
    expect(hfInference.resolveModelAndProvider({ model: 'Qwen/Qwen3-8B:preferred', provider: undefined })).toEqual({
      model: 'Qwen/Qwen3-8B',
      provider: 'auto',
    });
  });

  it('rejects the :fastest and :cheapest routing policies', () => {
    expect(() => hfInference.resolveModelAndProvider({ model: 'Qwen/Qwen3-8B:fastest', provider: undefined })).toThrow(
      /':fastest' routing policy is not supported/
    );
    expect(() => hfInference.resolveModelAndProvider({ model: 'Qwen/Qwen3-8B:cheapest', provider: undefined })).toThrow(
      /':cheapest' routing policy is not supported/
    );
  });

  it('rejects a suffix that conflicts with the selected provider', () => {
    expect(() => hfInference.resolveModelAndProvider({ model: 'Qwen/Qwen3-8B:groq', provider: 'together' })).toThrow(
      /conflicts with the selected provider 'together'/
    );
  });

  it('accepts a suffix that matches the selected provider', () => {
    expect(hfInference.resolveModelAndProvider({ model: 'Qwen/Qwen3-8B:groq', provider: 'groq' })).toEqual({
      model: 'Qwen/Qwen3-8B',
      provider: 'groq',
    });
  });

  it('rejects unknown providers and suffixes', () => {
    expect(() => hfInference.resolveModelAndProvider({ model: 'Qwen/Qwen3-8B', provider: 'nope' })).toThrow(
      /Unknown inference provider 'nope'/
    );
    expect(() => hfInference.resolveModelAndProvider({ model: 'Qwen/Qwen3-8B:nope', provider: undefined })).toThrow(
      /Unknown provider suffix ':nope'/
    );
  });
});

describe('generate_chat_completion model selection', () => {
  it('uses openai/gpt-oss-20b when the model is left empty', async () => {
    chatCompletion.mockResolvedValueOnce({ choices: [{ message: { content: 'Hello' }, finish_reason: 'stop' }] });

    const result = await runChat({ model: undefined });

    expect(chatCompletion.mock.calls[0][0]).toMatchObject({ model: 'openai/gpt-oss-20b', provider: undefined });
    expect(result).toMatchObject({ content: 'Hello', finish_reason: 'stop', model: 'openai/gpt-oss-20b' });
  });

  it('accepts any typed model ID with a provider suffix', async () => {
    chatCompletion.mockResolvedValueOnce({ model: 'meta-llama/Llama-3.1-8B-Instruct', choices: [] });

    await runChat({ model: 'meta-llama/Llama-3.1-8B-Instruct:groq' });

    expect(chatCompletion.mock.calls[0][0]).toMatchObject({
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      provider: 'groq',
    });
  });

  it('prepends the system prompt as a leading system message', async () => {
    chatCompletion.mockResolvedValueOnce({ choices: [] });

    await runChat({ model: 'openai/gpt-oss-20b', system_prompt: 'Be brief.' });

    expect(chatCompletion.mock.calls[0][0].messages).toEqual([
      { role: 'system', content: 'Be brief.' },
      { role: 'user', content: 'Hi' },
    ]);
  });

  it('rejects a routing policy suffix before calling the provider', async () => {
    await expect(runChat({ model: 'openai/gpt-oss-20b:fastest' })).rejects.toThrow(/not supported/);
    expect(chatCompletion).not.toHaveBeenCalled();
  });
});
