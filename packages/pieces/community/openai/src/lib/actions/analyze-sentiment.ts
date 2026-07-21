import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

const sentiments = ['positive', 'negative', 'neutral'] as const;

export const analyzeSentiment = createAction({
  audience: 'human',
  auth: openaiAuth,
  name: 'analyze_sentiment',
  displayName: 'Analyze Text Sentiment',
  description:
    'Analyzes text for sentiment (positive, negative, or neutral).',
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
    let parsed: { sentiment?: string; confidence?: number; explanation?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      // ponytail: model ignored the JSON instruction; degrade instead of throwing
      parsed = { explanation: raw };
    }

    const normalized = (parsed.sentiment ?? '').toLowerCase();
    const sentiment = sentiments.find((s) => s === normalized) ?? 'neutral';

    return {
      sentiment,
      confidence: parsed.confidence,
      explanation: parsed.explanation,
    };
  },
});
