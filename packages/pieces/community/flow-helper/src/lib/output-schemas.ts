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

export const waitForResumeActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'payload', label: 'Resume payload' },
    { key: 'queryParams', label: 'Query params' },
  ],
};

export const createWaitpointActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'waitpointId', label: 'Waitpoint ID' },
    { key: 'resumeUrl', label: 'Resume URL', format: 'url' },
  ],
};
