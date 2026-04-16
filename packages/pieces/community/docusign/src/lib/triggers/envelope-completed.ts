import { createEnvelopeEventTrigger } from '../envelope-event-trigger';

export const envelopeCompleted = createEnvelopeEventTrigger({
  name: 'envelopeCompleted',
  displayName: 'Envelope Completed',
  description:
    'Triggers when all recipients have signed and the envelope reaches the completed state.',
  docusignEvent: 'envelope-completed',
  sampleData: {
    status: 'completed',
    envelopeId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    emailSubject: 'Please sign this document',
    sender: {
      userName: 'Jane Doe',
      email: 'jane.doe@example.com',
    },
    completedDateTime: '2024-01-15T10:30:00.000Z',
  },
});
