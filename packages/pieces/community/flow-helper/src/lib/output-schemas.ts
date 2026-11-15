import { OutputSchema } from '@activepieces/pieces-framework';

export const getRunIdActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Run ID' },
    { key: 'url', label: 'Run URL', format: 'url' },
  ],
};

export const stopFlowActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
  ],
};
