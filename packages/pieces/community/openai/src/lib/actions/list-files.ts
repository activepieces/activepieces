import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

export const listFiles = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'list_files',
  displayName: 'List Files',
  description:
    'Return the list of files uploaded to the connected OpenAI account, optionally filtered by purpose.',
  aiMetadata: { description: 'Returns the files stored in the connected OpenAI account together with their ids, names, sizes, and purposes, either the whole account or, when a purpose filter is supplied, only assistants, vision, batch, or fine-tune files, capped by an optional limit. Use it to browse or audit what has been uploaded and to collect file ids; find_file is the better choice when checking for one exact filename. Read-only and idempotent.', idempotent: true },
  props: {
    purpose: Property.StaticDropdown({
      displayName: 'Purpose Filter',
      description: 'If supplied, only files with this purpose are returned.',
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
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of files to return (1-10000). Defaults to 10000.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const openai = new OpenAI({ apiKey: context.auth.secret_text });
    const { purpose, limit } = context.propsValue;

    const params: { purpose?: string; limit?: number } = {};
    if (purpose) params.purpose = purpose;
    if (typeof limit === 'number') params.limit = limit;

    const response = await openai.files.list(params);

    return {
      files: response.data,
      count: response.data.length,
    };
  },
});
