import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

export const classifyText = createAction({
  auth: openaiAuth,
  name: 'classify_text',
  displayName: 'Classify Text (Moderation)',
  description:
    'Classify whether the supplied text violates OpenAI safety policies (harassment, hate, self-harm, sexual, violence, etc.).',
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
