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
    // An array of URL strings, not objects: the viewer applies a field's format
    // to each item of a primitive list, so `url` renders every one as a link.
    {
      key: 'files',
      label: 'Files',
      format: 'url',
      description: 'Attached file URLs.',
    },
  ],
};

// form_submission has no fixed shape here -- its keys are whatever the flow builder names in the Inputs array.
