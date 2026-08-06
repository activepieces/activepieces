import { OutputSchema } from '@activepieces/pieces-framework';

export const returnResponseActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Type', description: 'Always "markdown".' },
    { key: 'value', label: 'Text (Markdown)' },
    {
      key: 'files',
      label: 'Files',
      listItems: [
        { key: 'url', label: 'File URL', format: 'url' },
        { key: 'mimeType', label: 'MIME Type' },
      ],
    },
  ],
};

export const chatSubmissionTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'sessionId', label: 'Session ID' },
    { key: 'message', label: 'Message' },
    { key: 'files', label: 'Files', format: 'url' },
  ],
};

// form_submission has no fixed shape here -- its keys are whatever the flow builder names in the Inputs array.
