import { tinkoEvents } from '../common/events';
import { tinkoSamples } from '../common/samples';
import { createTinkoWebhookTrigger } from '../common/webhook';

export const chatEndedTrigger = createTinkoWebhookTrigger({
  name: 'chat_ended',
  displayName: 'Chat Ended',
  description: 'Triggers when a chat is closed.',
  aiMetadata: {
    description:
      'Fires once when a Tinko chat is closed (finished) by an attendant, an automation or the API, with the chat, channel and contact details.',
  },
  events: ['CHAT_ENDED'],
  filterChannelsOnServer: true,
  sampleData: tinkoSamples.chatEnded,
  mapEvent: tinkoEvents.chatEvent,
});
