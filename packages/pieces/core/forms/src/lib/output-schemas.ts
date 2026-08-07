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
    // An array of URL strings, not objects: `format` applies to leaf values, so
    // there is nothing here for it to describe.
    { key: 'files', label: 'Files', description: 'Attached file URLs.' },
  ],
};

// form_submission has no fixed shape here -- its keys are whatever the flow builder names in the Inputs array.
