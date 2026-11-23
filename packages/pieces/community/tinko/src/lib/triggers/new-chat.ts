import { tinkoEvents } from '../common/events';
import { tinkoSamples } from '../common/samples';
import { createTinkoWebhookTrigger } from '../common/webhook';

export const newChatTrigger = createTinkoWebhookTrigger({
  name: 'new_chat',
  displayName: 'New Chat',
  description: 'Triggers when a new chat (conversation) is opened.',
  aiMetadata: {
    description:
      'Fires once when a new chat (conversation) is opened in Tinko, with the chat, channel and contact details. Use New Message Received to react to every message instead.',
  },
  events: ['CHAT_CREATED'],
  filterChannelsOnServer: true,
  sampleData: tinkoSamples.chatCreated,
  mapEvent: tinkoEvents.chatEvent,
});
