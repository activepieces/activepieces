import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI, { toFile } from 'openai';
import type { FilePurpose } from 'openai/resources/files';
import mime from 'mime-types';
import { openaiAuth } from '../auth';
import { uploadFileActionOutputSchema } from '../output-schemas';

const allowedPurposes: readonly FilePurpose[] = [
  'assistants',
  'batch',
  'fine-tune',
  'vision',
];

const isFilePurpose = (value: string): value is FilePurpose =>
  allowedPurposes.some((p) => p === value);

export const uploadFile = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'upload_file',
  classification: 'WRITE',
  displayName: 'Upload File',
  description:
    'Upload a file for assistants, batch jobs, vision or fine-tuning.',
  aiMetadata: { description: 'Uploads a file to the connected OpenAI account and returns its file id for later use with Assistants, vector stores, batch jobs, fine-tuning, or vision. The purpose is required and decides which file types are accepted; the original filename is kept unless an override including the extension is supplied. Run find_file first to avoid duplicates, and delete_file to remove one afterwards. Not idempotent: every call stores another copy under a new file id, even for identical content.', idempotent: false },
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to send to OpenAI.',
      required: true,
    }),
    purpose: Property.StaticDropdown({
      displayName: 'Purpose',
      description:
        'What OpenAI will use the file for. Each allows different file types.',
      required: true,
      defaultValue: 'assistants',
      options: {
        options: [
          { label: 'Assistants', value: 'assistants' },
          { label: 'Vision', value: 'vision' },
          { label: 'Batch', value: 'batch' },
          { label: 'Fine-Tuning', value: 'fine-tune' },
        ],
      },
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Empty: keeps the original name. Include the extension.',
      placeholder: 'e.g. report.pdf',
      required: false,
      advanced: true,
    }),
  },
  outputSchema: uploadFileActionOutputSchema,
  async run(context) {
    const openai = new OpenAI({ apiKey: context.auth.secret_text });
    const { file, purpose, fileName } = context.propsValue;

    const effectiveName = fileName || file.filename || 'file';
    const contentType = mime.lookup(file.extension ?? effectiveName) || 'application/octet-stream';

    const uploadable = await toFile(file.data, effectiveName, { type: contentType });

    if (!isFilePurpose(purpose)) {
      throw new Error(`Unsupported file purpose: ${purpose}`);
    }

    const response = await openai.files.create({
      file: uploadable,
      purpose,
    });

    return response;
  },
});
