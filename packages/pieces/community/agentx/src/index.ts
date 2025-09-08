
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createConversationWithSingleAgent } from "./lib/actions/create-conversation-with-single-agent";
import { sendMessageToExistingConversation } from "./lib/actions/send-message-to-existing-conversation";
import { findMessage } from "./lib/actions/find-message";
import { searchAgents } from "./lib/actions/search-agents";
import { findConversation } from "./lib/actions/find-conversation";
import { newAgent } from "./lib/triggers/new-agent";
import { newConversation } from "./lib/triggers/new-conversation";
import { AgentXAuth } from "./lib/common/auth";


export const agentx = createPiece({
  displayName: "Agentx",
  auth: AgentXAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/agentx.png",
  authors: ['Niket2035'],
  actions: [createConversationWithSingleAgent, sendMessageToExistingConversation, findMessage, searchAgents,findConversation],
  triggers: [newAgent,newConversation],
});
