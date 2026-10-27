import { OutputSchema } from '@activepieces/pieces-framework';

export const verifyEmailActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'result', label: 'Result' },
    { key: 'subresult', label: 'Sub-Result' },
    { key: 'quality', label: 'Quality' },
    { key: 'resultcode', label: 'Result Code', format: 'number' },
    { key: 'free', label: 'Free Email Provider', format: 'boolean' },
    { key: 'role', label: 'Role Address', format: 'boolean' },
    { key: 'didyoumean', label: 'Did You Mean' },
    { key: 'credits', label: 'Credits Remaining', format: 'number' },
    { key: 'error', label: 'Error' },
  ],
};
