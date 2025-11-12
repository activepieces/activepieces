import { createChat } from './lib/chat';
import { ChatWidget } from './components/ChatWidget';

// Named export for React apps (ESM)
export { createChat, ChatWidget };

// Default export for UMD
export default createChat;
