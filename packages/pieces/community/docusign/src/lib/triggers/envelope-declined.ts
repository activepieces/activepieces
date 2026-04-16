import { createEnvelopeEventTrigger } from '../envelope-event-trigger';

export const envelopeDeclined = createEnvelopeEventTrigger({
  name: 'envelopeDeclined',
  displayName: 'Envelope Declined',
  description:
    'Triggers when a recipient declines to sign, stopping the envelope.',
  docusignEvent: 'envelope-declined',
  sampleData: {
    status: 'declined',
    envelopeId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    emailSubject: 'Please sign this document',
    sender: {
      userName: 'Jane Doe',
      email: 'jane.doe@example.com',
    },
    declinedDateTime: '2024-01-15T10:30:00.000Z',
    declinedReason: 'I do not agree with the terms.',
  },
});
