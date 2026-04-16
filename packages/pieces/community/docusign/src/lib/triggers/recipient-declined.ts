import { createEnvelopeEventTrigger } from '../envelope-event-trigger';

export const recipientDeclined = createEnvelopeEventTrigger({
  name: 'recipientDeclined',
  displayName: 'Recipient Declined',
  description:
    'Triggers when an individual recipient declines to sign the envelope.',
  docusignEvent: 'recipient-declined',
  sampleData: {
    envelopeId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    emailSubject: 'Please sign this document',
    recipients: {
      signers: [
        {
          name: 'John Smith',
          email: 'john.smith@example.com',
          recipientId: '1',
          status: 'declined',
          declinedDateTime: '2024-01-15T10:20:00.000Z',
          declinedReason: 'I do not agree with the terms.',
        },
      ],
    },
  },
});
