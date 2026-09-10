import { createAction, Property } from '@activepieces/pieces-framework';
import { GoogleGenAI } from '@google/genai';
import { googleGeminiAuth } from '../auth';
import { defaultLLM, getGeminiModelOptions } from '../common/common';
import { countTokensActionOutputSchema } from '../output-schemas';

export const countTokensAction = createAction({
  audience: 'both',
  name: 'count_tokens',
  classification: 'READ',
  auth: googleGeminiAuth,
  displayName: 'Count Tokens',
  description: 'Counts how many tokens a prompt will consume for a given Gemini model.',
  aiMetadata: {
    description:
      'Counts the tokens a piece of text will consume for a given Gemini model, without generating any content. Use it before generate_content or chat_gemini to check a prompt fits the model\'s input limit or to estimate cost. Idempotent: same text and model always return the same count.',
    idempotent: true,
  },
  props: {
    text: Property.LongText({
      displayName: 'Text',
      required: true,
      description: 'The text to count tokens for.',
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      auth: googleGeminiAuth,
      refreshers: [],
      defaultValue: defaultLLM,
      options: async ({ auth }) => getGeminiModelOptions({ auth }),
    }),
  },
  outputSchema: countTokensActionOutputSchema,
  async run({ auth, propsValue }) {
    const { text, model } = propsValue;

    const genAI = new GoogleGenAI({ apiKey: auth.secret_text });

    const response = await genAI.models.countTokens({
      model,
      contents: text,
    });

    return {
      totalTokens: response.totalTokens ?? null,
      cachedContentTokenCount: response.cachedContentTokenCount ?? null,
    };
  },
});
