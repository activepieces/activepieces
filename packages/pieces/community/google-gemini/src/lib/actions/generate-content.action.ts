import { googleGeminiAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { defaultLLM, getGeminiModelOptions } from '../common/common';

export const generateContentAction = createAction({
  description:
    'Generate content using Google Gemini using the "gemini-pro" model',
  displayName: 'Generate Content',
  name: 'generate_content',
  auth: googleGeminiAuth,
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The prompt to generate content from.',
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      description: 'The model which will generate the completion',
      refreshers: [],
      defaultValue: defaultLLM,
      options: async ({ auth }) => getGeminiModelOptions({ auth }),
    }),
  },
  async run({ auth, propsValue }) {
    const genAI = new GoogleGenerativeAI(auth);
    const model = genAI.getGenerativeModel({ model: propsValue.model });
    const result = await model.generateContent(propsValue.prompt);
    return result.response.text();
  },
});
