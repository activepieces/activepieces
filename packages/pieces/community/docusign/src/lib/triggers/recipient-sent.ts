import { createEnvelopeEventTrigger } from '../envelope-event-trigger';

export const recipientSent = createEnvelopeEventTrigger({
  name: 'recipientSent',
  displayName: 'Recipient Sent',
  description:
    'Triggers when a signing request is sent to an individual recipient.',
  docusignEvent: 'recipient-sent',
  sampleData: {
    envelopeId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    emailSubject: 'Please sign this document',
    recipients: {
      signers: [
        {
          name: 'John Smith',
          email: 'john.smith@example.com',
          recipientId: '1',
          status: 'sent',
          sentDateTime: '2024-01-15T10:05:00.000Z',
        },
      ],
    },
  },
});
