import { createEnvelopeEventTrigger } from '../envelope-event-trigger';

export const envelopeSent = createEnvelopeEventTrigger({
  name: 'envelopeSent',
  displayName: 'Envelope Sent',
  description: 'Triggers when an envelope is sent to recipients.',
  docusignEvent: 'envelope-sent',
  sampleData: {
    status: 'sent',
    envelopeId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    emailSubject: 'Please sign this document',
    sender: {
      userName: 'Jane Doe',
      email: 'jane.doe@example.com',
    },
    sentDateTime: '2024-01-15T10:05:00.000Z',
  },
});
