import { AppConnectionType, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getGeminiEmbeddingModelOptions,
  getGeminiImageModelOptions,
  getGeminiModelOptions,
  getGeminiTtsModelOptions,
  getGeminiVideoModelOptions,
} from '../src/lib/common/common';
import { googleGeminiAuth } from '../src/lib/auth';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

const AUTH: AppConnectionValueForAuthProperty<typeof googleGeminiAuth> = {
  type: AppConnectionType.SECRET_TEXT,
  secret_text: 'key',
};

const GENERATE = ['generateContent', 'countTokens', 'createCachedContent', 'batchGenerateContent'];

const MODELS = [
  { name: 'models/gemini-2.5-flash', supportedGenerationMethods: GENERATE },
  { name: 'models/gemini-2.5-pro', supportedGenerationMethods: GENERATE },
  { name: 'models/gemini-2.5-flash-lite', supportedGenerationMethods: GENERATE },
  { name: 'models/gemini-3-flash-preview', supportedGenerationMethods: GENERATE },
  { name: 'models/gemini-3.1-pro-preview', supportedGenerationMethods: GENERATE },
  { name: 'models/gemini-3.1-flash-lite', supportedGenerationMethods: GENERATE },
  { name: 'models/gemini-3.5-flash', supportedGenerationMethods: GENERATE },
  { name: 'models/gemini-4-argon', supportedGenerationMethods: GENERATE },
  { name: 'models/gemini-2.5-flash-preview-tts', supportedGenerationMethods: ['countTokens', 'generateContent'] },
  { name: 'models/gemini-2.5-flash-image', supportedGenerationMethods: GENERATE },
  { name: 'models/gemini-3-pro-image-preview', supportedGenerationMethods: GENERATE },
  { name: 'models/gemini-nano-banana-2.1', supportedGenerationMethods: GENERATE },
  { name: 'models/gemini-2.5-flash-native-audio-latest', supportedGenerationMethods: GENERATE },
  { name: 'models/gemini-2.5-flash-live-preview', supportedGenerationMethods: GENERATE },
  { name: 'models/gemini-3.9-flash', supportedGenerationMethods: ['countTokens', 'bidiGenerateContent'] },
  { name: 'models/gemini-3.9-pro' },
  { name: 'models/gemini-robotics-er-1.5-preview', supportedGenerationMethods: GENERATE },
  { name: 'models/gemini-2.5-computer-use-preview-10-2025', supportedGenerationMethods: GENERATE },
  { name: 'models/gemini-embedding-001', supportedGenerationMethods: ['embedContent', 'countTextTokens'] },
  { name: 'models/gemma-3-27b-it', supportedGenerationMethods: ['generateContent', 'countTokens'] },
  { name: 'models/imagen-4.0-generate-001', supportedGenerationMethods: ['predict'] },
  { name: 'models/veo-3.0-generate-001', supportedGenerationMethods: ['predictLongRunning'] },
  { name: 'models/aqa', supportedGenerationMethods: ['generateAnswer'] },
  { name: 'models/gemini-5-omnimodal-deliverable', supportedGenerationMethods: GENERATE },
];

function optionValues(result: { options: { value: string }[] }) {
  return result.options.map((option) => option.value);
}

beforeEach(() => {
  sendRequest.mockReset();
  sendRequest.mockResolvedValue({ status: 200, headers: {}, body: { models: MODELS } });
});

describe('text model dropdown', () => {
  it('lists every Gemini text model the API returns, including Gemini 3 and newer', async () => {
    const values = optionValues(await getGeminiModelOptions({ auth: AUTH }));

    expect(values).toEqual([
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.5-flash-lite',
      'gemini-3-flash-preview',
      'gemini-3.1-pro-preview',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-4-argon',
      'gemini-5-omnimodal-deliverable',
    ]);
  });

  it('leaves the speech, image, video and embedding dropdowns unchanged', async () => {
    expect(optionValues(await getGeminiTtsModelOptions({ auth: AUTH }))).toEqual(['gemini-2.5-flash-preview-tts']);
    expect(optionValues(await getGeminiImageModelOptions({ auth: AUTH }))).toEqual([
      'gemini-2.5-flash-image',
      'gemini-3-pro-image-preview',
    ]);
    expect(optionValues(await getGeminiVideoModelOptions({ auth: AUTH }))).toEqual(['veo-3.0-generate-001']);
    expect(optionValues(await getGeminiEmbeddingModelOptions({ auth: AUTH }))).toEqual(['gemini-embedding-001']);
  });
});
