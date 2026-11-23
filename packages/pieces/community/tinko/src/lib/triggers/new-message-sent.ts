import { tinkoEvents } from '../common/events';
import { tinkoSamples } from '../common/samples';
import { createTinkoWebhookTrigger } from '../common/webhook';

export const newMessageSentTrigger = createTinkoWebhookTrigger({
  name: 'new_message_sent',
  displayName: 'New Message Sent',
  description: 'Triggers when a message is sent to a contact by an attendant, a bot or the API.',
  aiMetadata: {
    description:
      'Fires once for every outgoing message sent to a contact from a Tinko channel, whether by an attendant, an AI agent, an automation or the API, with the message, chat, channel and contact details.',
  },
  events: ['MESSAGE_SENT'],
  filterChannelsOnServer: true,
  sampleData: tinkoSamples.messageSent,
  mapEvent: tinkoEvents.message,
});
