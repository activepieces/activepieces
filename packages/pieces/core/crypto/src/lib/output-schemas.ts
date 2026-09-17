import { OutputSchema } from '@activepieces/pieces-framework';

export const openpgpEncryptActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'filename', label: 'File Name' },
    { key: 'file', label: 'Encrypted File', format: 'url' },
    { key: 'error', label: 'Error' },
  ],
};
