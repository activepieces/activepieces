import { addConversationContextAction } from './add-conversation-context';
import { createConversationAction } from './create-conversation';
import { getConversationAction } from './get-conversation';
import { getMessageTraceAction } from './get-message-trace';
import { getProfileAction } from './get-profile';
import { getTraceAction } from './get-trace';
import { listAgentsAction } from './list-agents';
import { listConversationsAction } from './list-conversations';
import { resetConversationContextAction } from './reset-conversation-context';
import { sendMessageAction } from './send-message';
import { sendMessageWithAttachmentAction } from './send-message-with-attachment';
import { textToSpeechAction } from './text-to-speech';

export const agentxAiActions = [
  listAgentsAction,
  listConversationsAction,
  getConversationAction,
  createConversationAction,
  sendMessageAction,
  sendMessageWithAttachmentAction,
  addConversationContextAction,
  resetConversationContextAction,
  getMessageTraceAction,
  getTraceAction,
  getProfileAction,
  textToSpeechAction,
];
