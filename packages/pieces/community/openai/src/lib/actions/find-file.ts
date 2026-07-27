import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

export const findFile = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'find_file',
  displayName: 'Find File',
  description:
    'Check whether a file with the given name already exists in the connected OpenAI account.',
  aiMetadata: { description: 'Checks whether a file with an exact filename, matched case-insensitively, already exists in the connected OpenAI account and returns a found flag, a match count, and the matching file records including their ids. Use it before upload_file to avoid duplicates, or to resolve a filename into the file id that delete_file needs; list_files is the one for browsing everything on the account. An optional purpose filter narrows the search to assistants, vision, batch, or fine-tune files. Read-only and idempotent.', idempotent: true },
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

    // The OpenAI files endpoint is not paginated — the SDK returns every file in
    // a single page (FileListParams has no cursor; the page is forwards-compat only),
    // so response.data is the complete list.
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
