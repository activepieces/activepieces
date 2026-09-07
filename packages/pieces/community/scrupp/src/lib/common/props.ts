import { Property } from '@activepieces/pieces-framework';

export const timeoutProp = Property.Number({
  displayName: 'Timeout (seconds)',
  description:
    'How long to wait for the job to finish. It keeps running on Scrupp after a timeout and can be fetched later by its job ID.',
  required: false,
  defaultValue: 900,
});

export const withEmailsProp = Property.Checkbox({
  displayName: 'Find Emails',
  description: 'Also find email addresses for the extracted people.',
  required: false,
  defaultValue: true,
});

export const maxRecordsProp = Property.Number({
  displayName: 'Max Records',
  description:
    'Upper bound on records to extract. This sets the upfront credit hold; unused credits are refunded.',
  required: false,
  defaultValue: 100,
});
