import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { generateText } from 'ai';
import { askAI } from './ask-ai';
import { summarizeText } from './summarize-text';

vi.mock('ai', () => ({
  generateText: vi.fn(async () => ({ text: 'ok', sources: [] })),
  stepCountIs: vi.fn(),
}));

vi.mock('../../common/ai-sdk', () => ({
  createAIModel: vi.fn(async () => ({})),
}));

const generateTextMock = vi.mocked(generateText);

const baseProps = {
  provider: { provider: 'openai', configId: 'config1' },
  model: 'gpt-test',
  maxOutputTokens: 2000,
};

async function askAiGenerateTextArgs({ creativity }: { creativity: number | null | undefined }) {
  await askAI.run(createMockActionContext({
    propsValue: { ...baseProps, prompt: 'hello', webSearch: false, creativity },
  }));
  return generateTextMock.mock.calls[0][0];
}

beforeEach(() => {
  generateTextMock.mockClear();
});

describe('askAI temperature', () => {
  it('omits temperature when creativity is not set', async () => {
    const args = await askAiGenerateTextArgs({ creativity: undefined });
    expect(args).not.toHaveProperty('temperature');
  });

  it('omits temperature when creativity is null', async () => {
    const args = await askAiGenerateTextArgs({ creativity: null });
    expect(args).not.toHaveProperty('temperature');
  });

  it('sends temperature scaled from an explicit creativity', async () => {
    const args = await askAiGenerateTextArgs({ creativity: 50 });
    expect(args.temperature).toBe(0.5);
  });

  it('sends temperature 1 for the previously seeded default of 100', async () => {
    const args = await askAiGenerateTextArgs({ creativity: 100 });
    expect(args.temperature).toBe(1);
  });

  it('sends temperature 0 when creativity is 0', async () => {
    const args = await askAiGenerateTextArgs({ creativity: 0 });
    expect(args.temperature).toBe(0);
  });
});

describe('summarizeText temperature', () => {
  it('sends no temperature', async () => {
    await summarizeText.run(createMockActionContext({
      propsValue: { ...baseProps, text: 'long text', prompt: 'Summarize' },
    }));
    expect(generateTextMock.mock.calls[0][0]).not.toHaveProperty('temperature');
  });
});
