import { createTimelinesAiTrigger } from '../common/trigger';

export const chatRenamedTrigger = createTimelinesAiTrigger({
  name: 'chat_renamed',
  displayName: 'Chat Renamed',
  description: 'Fires when the name of a chat is updated.',
  eventType: 'chat_renamed',
  sampleData: {
    id: 'chat_123456789',
    name: 'John Doe - Priority',
    previous_name: 'John Doe',
  },
});
