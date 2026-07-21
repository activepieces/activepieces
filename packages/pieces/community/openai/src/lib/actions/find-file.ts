import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

export const findFile = createAction({
  audience: 'human',
  auth: openaiAuth,
  name: 'find_file',
  displayName: 'Find File',
  description:
    'Check whether a file with the given name already exists in the connected OpenAI account.',
  props: {
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'The exact filename to look for (case-insensitive).',
      required: true,
    }),
    purpose: Property.StaticDropdown({
      displayName: 'Purpose Filter',
      description: 'If supplied, only files with this purpose are searched.',
      required: false,
      options: {
        options: [
          { label: 'Assistants', value: 'assistants' },
          { label: 'Vision', value: 'vision' },
          { label: 'Batch', value: 'batch' },
          { label: 'Fine-tune', value: 'fine-tune' },
        ],
      },
    }),
  },
  async run(context) {
    const openai = new OpenAI({ apiKey: context.auth.secret_text });
    const { fileName, purpose } = context.propsValue;

    const response = await openai.files.list(purpose ? { purpose } : {});

    const target = fileName.toLowerCase();
    const matches = response.data.filter(
      (file) => file.filename.toLowerCase() === target
    );

    return {
      found: matches.length > 0,
      count: matches.length,
      file: matches[0] ?? null,
      files: matches,
    };
  },
});
