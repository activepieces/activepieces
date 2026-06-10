import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI, { toFile } from 'openai';
import type { FilePurpose } from 'openai/resources/files';
import mime from 'mime-types';
import { openaiAuth } from '../auth';

const allowedPurposes: readonly FilePurpose[] = [
  'assistants',
  'batch',
  'fine-tune',
  'vision',
];

const isFilePurpose = (value: string): value is FilePurpose =>
  allowedPurposes.some((p) => p === value);

export const uploadFile = createAction({
  auth: openaiAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description:
    'Upload a file to OpenAI for use with Assistants, Vector Stores, Batch jobs, Fine-tuning, or Vision.',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload.',
      required: true,
    }),
    purpose: Property.StaticDropdown({
      displayName: 'Purpose',
      description:
        'The intended use of the file. Each purpose has different allowed file types — see https://platform.openai.com/docs/api-reference/files/create.',
      required: true,
      defaultValue: 'assistants',
      options: {
        options: [
          { label: 'Assistants', value: 'assistants' },
          { label: 'Vision', value: 'vision' },
          { label: 'Batch', value: 'batch' },
          { label: 'Fine-tune', value: 'fine-tune' },
        ],
      },
    }),
    fileName: Property.ShortText({
      displayName: 'Override Filename',
      description:
        'Optional. By default the original filename is used. Provide a value to override (must include the extension).',
      required: false,
    }),
  },
  async run(context) {
    const openai = new OpenAI({ apiKey: context.auth.secret_text });
    const { file, purpose, fileName } = context.propsValue;

    const effectiveName = fileName ?? file.filename ?? 'file';
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
