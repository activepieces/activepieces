import { tinkoEvents } from '../common/events';
import { tinkoSamples } from '../common/samples';
import { createTinkoWebhookTrigger } from '../common/webhook';

export const newMessageReceivedTrigger = createTinkoWebhookTrigger({
  name: 'new_message_received',
  displayName: 'New Message Received',
  description: 'Triggers when a contact sends a message to one of your channels.',
  aiMetadata: {
    description:
      'Fires once for every message a contact sends to a connected Tinko channel (WhatsApp, Instagram, site chat and others), with the message, chat, channel and contact details.',
  },
  events: ['MESSAGE_RECEIVED'],
  filterChannelsOnServer: true,
  sampleData: tinkoSamples.messageReceived,
  mapEvent: tinkoEvents.message,
});
