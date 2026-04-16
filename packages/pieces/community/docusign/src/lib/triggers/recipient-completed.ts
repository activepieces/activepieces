import { createEnvelopeEventTrigger } from '../envelope-event-trigger';

export const recipientCompleted = createEnvelopeEventTrigger({
  name: 'recipientCompleted',
  displayName: 'Recipient Completed',
  description: 'Triggers when an individual recipient has signed the envelope.',
  docusignEvent: 'recipient-completed',
  sampleData: {
    envelopeId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    emailSubject: 'Please sign this document',
    recipients: {
      signers: [
        {
          name: 'John Smith',
          email: 'john.smith@example.com',
          recipientId: '1',
          status: 'completed',
          signedDateTime: '2024-01-15T10:25:00.000Z',
        },
      ],
    },
  },
});
