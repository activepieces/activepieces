import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { Mistral } from '@mistralai/mistralai';
import { mistralAuth } from '../..';

export const uploadFile = createAction({
  auth: mistralAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description: 'Upload a file for fine-tuning',
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
      description: 'The file to upload',
    }),
    purpose: Property.Dropdown({
      displayName: 'Purpose',
      required: true,
      description: 'The intended purpose of the file',
      refreshers: [],
      defaultValue: 'fine-tune',
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Fine-tune', value: 'fine-tune' },
            { label: 'Batch', value: 'batch' },
          ],
        };
      },
    }),
  },
  async run({ auth, propsValue }) {
    const client = new Mistral({
      apiKey: auth,
    });

    const { file, purpose } = propsValue;

    // Convert base64 file to Blob
    const buffer = Buffer.from(file.base64, 'base64');
    const blob = new Blob([buffer], {
      type: file.extension?.includes('json') ? 'application/jsonl' : 'application/octet-stream',
    });

    const response = await client.files.upload({
      file: blob,
      purpose: purpose,
    });

    return response;
  },
});
