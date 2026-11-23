import { tinkoEvents } from '../common/events';
import { tinkoSamples } from '../common/samples';
import { createTinkoWebhookTrigger } from '../common/webhook';

export const chatTransferredTrigger = createTinkoWebhookTrigger({
  name: 'chat_transferred',
  displayName: 'Chat Transferred',
  description: 'Triggers when a chat is moved to another channel or attendant.',
  aiMetadata: {
    description:
      'Fires once when a Tinko chat is transferred, with the channel it came from, the channel and attendant it went to, and the contact details. The channel filter matches the channel the chat came from.',
  },
  events: ['CHAT_TRANSFERRED'],
  filterChannelsOnServer: true,
  sampleData: tinkoSamples.chatTransferred,
  mapEvent: tinkoEvents.chatTransferred,
});
