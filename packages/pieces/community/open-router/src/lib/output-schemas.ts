import { OutputSchema } from '@activepieces/pieces-framework';

export const askLmmActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'response',
      label: 'Response',
      value: '',
      description: 'The LLM\'s generated text response.',
    },
  ],
};
