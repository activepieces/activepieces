import { googleGeminiAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getApiKeyFormAuth, PromptXAuthType } from '../common/pmtx-api';
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
      options: async ({ auth }) => {
        let geminiKey: string;
        try {
          geminiKey = String(await getApiKeyFormAuth(auth as PromptXAuthType));
        } catch (error) {
          console.error(error);
          return {
            disabled: true,
            placeholder: 'Unable to fetch OpenAI key. Check connection',
            options: [],
          };
        }

        return getGeminiModelOptions({ auth: geminiKey });
      },
    }),
  },
  async run({ auth, propsValue }) {
    const geminiKey: string = await getApiKeyFormAuth(auth as PromptXAuthType);
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: propsValue.model });
    const result = await model.generateContent(propsValue.prompt);
    return result.response.text();
  },
});
