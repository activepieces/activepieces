import { createSubscriptionTrigger } from '../common/subscription-trigger';

export const newVoicemail = createSubscriptionTrigger<{
  id?: string | number;
}>({
  name: 'new_voicemail',
  displayName: 'New Voicemail',
  description: 'Triggers when a new voicemail message is received.',
  // The dedicated voicemail filter, NOT message-store/instant. The instant filter is documented for
  // inbound SMS only, so `?type=VoiceMail` either fails validation on enable or enables and never
  // delivers. https://developers.ringcentral.com/guide/notifications/event-filters/voicemail-message
  eventFilters: ['/restapi/v1.0/account/~/extension/~/voicemail'],
  sampleData: {
    uuid: '5a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
    id: 2233445566,
    to: [{ phoneNumber: '+14155550100', name: 'RingCentral User' }],
    from: { phoneNumber: '+14155550123', name: 'Jane Caller' },
    type: 'VoiceMail',
    creationTime: '2024-01-15T19:05:00.000Z',
    readStatus: 'Unread',
    priority: 'Normal',
    attachments: [
      { id: 222, type: 'AudioRecording', contentType: 'audio/mpeg', vmDuration: 12 },
    ],
    direction: 'Inbound',
    availability: 'Alive',
    messageStatus: 'Received',
    vmTranscriptionStatus: 'NotAvailable',
    lastModifiedTime: '2024-01-15T19:05:00.000Z',
  },
});
