import { createSubscriptionTrigger } from '../common/subscription-trigger';

export const newInboundSms = createSubscriptionTrigger<{
  id?: string | number;
  direction?: string;
}>({
  name: 'new_inbound_sms',
  displayName: 'New Inbound SMS or MMS',
  description:
    'Triggers when a new inbound text message is received, with or without media attached.',
  // ONE filter, and `type=SMS` is correct for picture messages too. Do not add `type=MMS`: there is
  // no MMS message type. RingCentral delivers an inbound MMS through this same filter with
  // `type: 'SMS'` and an `MmsAttachment` part, and an unrecognised type value can fail the whole
  // createSubscription call, which would break the trigger rather than widen it.
  // https://developers.ringcentral.com/guide/messaging/sms/receiving-sms-mms
  eventFilters: ['/restapi/v1.0/account/~/extension/~/message-store/instant?type=SMS'],
  // The instant message-store filter also fires for what this extension sends.
  accept: (message) => message.direction === 'Inbound',
  sampleData: {
    uuid: '3c9d3d10-1f1a-4f0e-9b0e-2f2a9a1a4b6c',
    id: 1234567890,
    to: [{ phoneNumber: '+14155550100', name: 'RingCentral User' }],
    from: { phoneNumber: '+14155550123' },
    type: 'SMS',
    creationTime: '2024-01-15T18:30:00.000Z',
    readStatus: 'Unread',
    priority: 'Normal',
    // A text-only SMS carries just the Text part. An inbound MMS looks identical except for an
    // extra MmsAttachment part, which is what Download Message Attachment fetches.
    attachments: [
      { id: 111, type: 'Text', contentType: 'text/plain' },
      { id: 222, type: 'MmsAttachment', contentType: 'image/jpeg' },
    ],
    direction: 'Inbound',
    availability: 'Alive',
    subject: 'Hello from a customer!',
    messageStatus: 'Received',
    conversationId: 9876543210,
    conversation: { id: '9876543210' },
    lastModifiedTime: '2024-01-15T18:30:00.000Z',
  },
});
