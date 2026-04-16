import { createEnvelopeEventTrigger } from '../envelope-event-trigger';

export const envelopeDelivered = createEnvelopeEventTrigger({
  name: 'envelopeDelivered',
  displayName: 'Envelope Delivered',
  description:
    'Triggers when all recipients have viewed the envelope at least once.',
  docusignEvent: 'envelope-delivered',
  sampleData: {
    status: 'delivered',
    envelopeId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    emailSubject: 'Please sign this document',
    sender: {
      userName: 'Jane Doe',
      email: 'jane.doe@example.com',
    },
    deliveredDateTime: '2024-01-15T10:15:00.000Z',
  },
});
