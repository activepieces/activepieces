import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

export const classifyText = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'classify_text',
  displayName: 'Classify Text (Moderation)',
  description:
    'Classify whether the supplied text violates OpenAI safety policies (harassment, hate, self-harm, sexual, violence, etc.).',
  aiMetadata: { description: 'Runs the OpenAI moderation endpoint over a block of text and reports whether it breaches OpenAI safety policy, returning one flagged boolean plus per-category verdicts and scores for harassment, hate, self-harm, sexual, and violence. Use it to gate or filter user-generated content; it only scores that fixed safety taxonomy, so use analyze_sentiment for tone and extract-structured-data or ask_chatgpt to sort text into custom labels. Requires the input text and a moderation model. Read-only scoring call with no stored side effect, so repeating the same input is idempotent.', idempotent: true },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      description: 'Moderation model to use. omni-moderation-latest also supports images.',
      defaultValue: 'omni-moderation-latest',
      options: {
        options: [
          { label: 'omni-moderation-latest', value: 'omni-moderation-latest' },
          { label: 'text-moderation-latest', value: 'text-moderation-latest' },
          { label: 'text-moderation-stable', value: 'text-moderation-stable' },
        ],
      },
    }),
    input: Property.LongText({
      displayName: 'Input',
      description: 'The text to classify.',
      required: true,
    }),
  },
  async run(context) {
    const openai = new OpenAI({ apiKey: context.auth.secret_text });
    const { model, input } = context.propsValue;

    const response = await openai.moderations.create({
      model,
      input,
    });

    const result = response.results[0];
    return {
      flagged: result?.flagged ?? false,
      categories: result?.categories ?? {},
      category_scores: result?.category_scores ?? {},
      model: response.model,
      id: response.id,
    };
  },
});
