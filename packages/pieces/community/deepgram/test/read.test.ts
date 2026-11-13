import { afterEach, describe, expect, test, vi } from 'vitest';
import { analyzeTextAction } from '../src/actions/analyze-text';
import { runAction, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

const nestedShape = {
  metadata: {
    metadata: {
      request_id: 'read-1',
      language: 'en',
      summary_info: { input_tokens: 350, output_tokens: 75 },
      topics_info: { input_tokens: 350, output_tokens: 20 },
    },
  },
  results: {
    summary: { results: { summary: { text: 'Nested summary.' } } },
    topics: {
      results: {
        topics: {
          segments: [
            {
              text: 'Seg',
              topics: [{ topic: 'Space', confidence_score: 0.9 }],
            },
          ],
        },
      },
    },
    intents: {
      results: {
        intents: {
          segments: [
            {
              text: 'Seg',
              intents: [{ intent: 'Subscribe', confidence_score: 0.1 }],
            },
          ],
        },
      },
    },
    sentiments: {
      segments: [{ text: 'Seg', sentiment: 'positive', sentiment_score: 0.58 }],
      average: { sentiment: 'positive', sentiment_score: 0.5 },
    },
  },
};

const flatShape = {
  metadata: {
    request_id: 'read-2',
    language: 'en',
    summary_info: { input_tokens: 10, output_tokens: 5 },
  },
  results: {
    summary: { text: 'Flat summary.' },
    topics: {
      segments: [
        { text: 'Seg', topics: [{ topic: 'Space', confidence_score: 0.9 }] },
      ],
    },
  },
};

describe('analyze_text', () => {
  test('sends text with the chosen features and repeated custom topics', async () => {
    const seen = stubFetch(() => ({ body: nestedShape }));
    await runAction({
      action: analyzeTextAction,
      propsValue: {
        text: 'Some English text.',
        summarize: true,
        sentiment: true,
        customTopics: ['Billing', 'Refunds'],
        customTopicMode: 'strict',
      },
    });
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/read?language=en&summarize=true&topics=true&sentiment=true&custom_topic=Billing&custom_topic=Refunds&custom_topic_mode=strict'
    );
    expect(seen[0].json).toEqual({ text: 'Some English text.' });
  });

  test('flattens the nested response shape', async () => {
    stubFetch(() => ({ body: nestedShape }));
    const result = await runAction({
      action: analyzeTextAction,
      propsValue: {
        textUrl: 'https://static.deepgram.com/examples/aura.txt',
        summarize: true,
        topics: true,
      },
    });
    expect(result).toEqual({
      request_id: 'read-1',
      language: 'en',
      summary: 'Nested summary.',
      topics: [{ topic: 'Space', confidence: 0.9, text: 'Seg' }],
      intents: [{ intent: 'Subscribe', confidence: 0.1, text: 'Seg' }],
      sentiment: 'positive',
      sentiment_score: 0.5,
      sentiment_segments: [
        { text: 'Seg', sentiment: 'positive', sentiment_score: 0.58 },
      ],
      input_tokens: 350,
      output_tokens: 95,
    });
  });

  test('flattens the flat response shape', async () => {
    stubFetch(() => ({ body: flatShape }));
    const result = await runAction({
      action: analyzeTextAction,
      propsValue: { text: 'x', summarize: true },
    });
    expect(result).toEqual(
      expect.objectContaining({
        request_id: 'read-2',
        summary: 'Flat summary.',
        topics: [{ topic: 'Space', confidence: 0.9, text: 'Seg' }],
        intents: [],
        sentiment: null,
      })
    );
  });

  test.each([
    [{ summarize: true }, 'Provide the text to analyze'],
    [{ text: 'x', textUrl: 'https://a.io/t.txt', summarize: true }, 'not both'],
    [{ text: 'x', summarize: false }, 'Turn on at least one'],
    [
      { textUrl: 'file:///etc/passwd', summarize: true },
      'must start with https://',
    ],
  ])('rejects %j before any request', async (props, message) => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(
      runAction({ action: analyzeTextAction, propsValue: props })
    ).rejects.toThrow(message);
    expect(seen).toHaveLength(0);
  });
});
