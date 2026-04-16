import { createEnvelopeEventTrigger } from '../envelope-event-trigger';

export const recipientDelivered = createEnvelopeEventTrigger({
  name: 'recipientDelivered',
  displayName: 'Recipient Delivered',
  description:
    'Triggers when an individual recipient has viewed the envelope.',
  docusignEvent: 'recipient-delivered',
  sampleData: {
    envelopeId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    emailSubject: 'Please sign this document',
    recipients: {
      signers: [
        {
          name: 'John Smith',
          email: 'john.smith@example.com',
          recipientId: '1',
          status: 'delivered',
          deliveredDateTime: '2024-01-15T10:15:00.000Z',
        },
      ],
    },
  },
});
