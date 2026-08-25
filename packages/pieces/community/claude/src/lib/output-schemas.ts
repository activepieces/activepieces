import { OutputSchema } from '@activepieces/pieces-framework';

export const askClaudeActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'response',
      label: 'Response',
      value: '',
    },
  ],
};

export const extractStructuredDataActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'email',
      label: 'Email',
      format: 'email',
    },
    {
      key: 'phone',
      label: 'Phone',
    },
    {
      key: 'city',
      label: 'City',
    },
  ],
};
