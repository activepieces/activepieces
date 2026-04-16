import { createEnvelopeEventTrigger } from '../envelope-event-trigger';

export const envelopeCreated = createEnvelopeEventTrigger({
  name: 'envelopeCreated',
  displayName: 'Envelope Created',
  description: 'Triggers when a new envelope is created.',
  docusignEvent: 'envelope-created',
  sampleData: {
    status: 'created',
    envelopeId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    emailSubject: 'Please sign this document',
    sender: {
      userName: 'Jane Doe',
      email: 'jane.doe@example.com',
    },
    createdDateTime: '2024-01-15T10:00:00.000Z',
  },
});
