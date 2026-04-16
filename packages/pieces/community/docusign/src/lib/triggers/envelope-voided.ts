import { createEnvelopeEventTrigger } from '../envelope-event-trigger';

export const envelopeVoided = createEnvelopeEventTrigger({
  name: 'envelopeVoided',
  displayName: 'Envelope Voided',
  description:
    'Triggers when a sender voids an in-progress envelope, cancelling all pending signatures.',
  docusignEvent: 'envelope-voided',
  sampleData: {
    status: 'voided',
    envelopeId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    emailSubject: 'Please sign this document',
    sender: {
      userName: 'Jane Doe',
      email: 'jane.doe@example.com',
    },
    voidedDateTime: '2024-01-15T10:30:00.000Z',
    voidedReason: 'Document needs to be revised.',
  },
});
