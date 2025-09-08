import { createPiece } from "@activepieces/pieces-framework";
import { Agent, PieceCategory } from "@activepieces/shared";
import { AgentXAuth  } from "./lib/common";
import { createConversation } from "./lib/actions/create-conversation";
import { sendMessage } from "./lib/actions/send-message";
import { searchAgents } from "./lib/actions/search-agents";
import { findConversation } from "./lib/actions/find-conversation";
import { findMessage } from "./lib/actions/find-message";
import { newAgentTrigger } from "./lib/triggers/new-agent";
import { newConversationTrigger } from "./lib/triggers/new-conversation";

export const agentx = createPiece({
    displayName: "AgentX",
    auth: AgentXAuth ,
    minimumSupportedRelease: '0.20.0',
    logoUrl: "https://cdn.activepieces.com/pieces/agentx.png",
    authors: [
    ],
    actions: [
        createConversation,
        sendMessage,
        searchAgents,
        findConversation,
        findMessage
    ],
    triggers: [
        newAgentTrigger,
        newConversationTrigger
    ],
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
});