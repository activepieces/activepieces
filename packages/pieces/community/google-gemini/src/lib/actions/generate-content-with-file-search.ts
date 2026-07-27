import { googleGeminiAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { defaultLLM, getGeminiModelOptions } from '../common/common';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime-types';
import { generateContentWithFilesearchActionOutputSchema } from '../output-schemas';

export const generateContentWithFileSearchAction = createAction({
  audience: 'both',
  description: 'Generate content with file search functionality.',
  aiMetadata: { description: 'Uploads one file to a newly created Gemini File Search store, waits for indexing to finish, then answers the prompt grounded on that document. Use it for one-shot question answering over a document supplied at run time; prefer generate_content when no file grounding is needed or when a different built-in tool such as Google Search or URL Context fits better. Both a file and a store display name are required. Not idempotent: every call creates another file search store and a fresh completion.', idempotent: false },
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
  outputSchema: generateContentWithFilesearchActionOutputSchema,
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
