import { googleGeminiAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { defaultLLM, getGeminiModelOptions } from '../common/common';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime-types';

export const generateContentWithFileSearchAction = createAction({
  description: 'Generate content with file search functionality.',
  displayName: 'Generate Content with File Search',
  name: 'generate_content_with_filesearch',
  auth: googleGeminiAuth,
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The prompt to generate content from.',
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      auth: googleGeminiAuth,
      required: true,
      description: 'The model which will generate the completion',
      refreshers: [],
      defaultValue: defaultLLM,
      options: async ({ auth }) => getGeminiModelOptions({ auth }),
    }),
    fileStoreName: Property.ShortText({
      displayName: 'File Store Name',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { file, fileStoreName, model, prompt } = propsValue;

    const fileBlob = new Blob([Buffer.from(file.base64, 'base64')], {
      type: mime.lookup(file.extension || file.filename) || undefined,
    });

    const genAI = new GoogleGenAI({ apiKey: auth.secret_text });

    const fileSearchStore = await genAI.fileSearchStores.create({
      config: { displayName: fileStoreName },
    });

    let operation = await genAI.fileSearchStores.uploadToFileSearchStore({
      file: fileBlob,
      fileSearchStoreName: fileSearchStore.name!,
      config: {
        displayName: file.filename,
      },
    });

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await genAI.operations.get({ operation });
    }

    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [fileSearchStore.name!],
            },
          },
        ],
      },
    });

    return response.text;
  },
});
