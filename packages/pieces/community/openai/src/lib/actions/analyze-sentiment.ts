import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

const sentiments = ['positive', 'negative', 'neutral'] as const;

export const analyzeSentiment = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'analyze_sentiment',
  displayName: 'Analyze Text Sentiment',
  description:
    'Analyzes text for sentiment (positive, negative, or neutral).',
  aiMetadata: { description: 'Judges the emotional tone of a block of text with a chat model at temperature 0, returning a positive, negative, or neutral label plus a confidence score and a short explanation. Pick it for tone or satisfaction scoring; classify_text is the one that checks text against OpenAI safety policies, and extract-structured-data is the one that pulls arbitrary named fields or custom labels out of prose. Requires the text and a chat model; not idempotent: each call is a fresh model completion and the label can shift between runs.', idempotent: false },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      description: 'The chat model used to judge sentiment.',
      defaultValue: 'gpt-4o-mini',
      options: {
        options: [
          { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
          { label: 'gpt-4o', value: 'gpt-4o' },
          { label: 'gpt-4.1-mini', value: 'gpt-4.1-mini' },
          { label: 'gpt-4.1', value: 'gpt-4.1' },
          { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
        ],
      },
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to analyze.',
      required: true,
    }),
  },
  async run(context) {
    const openai = new OpenAI({ apiKey: context.auth.secret_text });
    const { model, text } = context.propsValue;

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a sentiment classifier. Respond ONLY with a JSON object of the form {"sentiment": "positive" | "negative" | "neutral", "confidence": number between 0 and 1, "explanation": string}.',
        },
        { role: 'user', content: text },
      ],
    });

    const raw = completion.choices[0]?.message.content ?? '{}';
    let parsed: { sentiment?: unknown; confidence?: unknown; explanation?: unknown };
    try {
      parsed = JSON.parse(raw);
    } catch {
      // ponytail: model ignored the JSON instruction; degrade instead of throwing
      parsed = { explanation: raw };
    }

    const normalized = String(parsed.sentiment ?? '').toLowerCase();
    const sentiment = sentiments.find((s) => s === normalized) ?? 'neutral';

    const confidence =
      typeof parsed.confidence === 'number' &&
      parsed.confidence >= 0 &&
      parsed.confidence <= 1
        ? parsed.confidence
        : undefined;

    return {
      sentiment,
      confidence,
      explanation:
        typeof parsed.explanation === 'string' ? parsed.explanation : undefined,
    };
  },
});
