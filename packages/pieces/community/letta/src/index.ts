import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { lettaAuth } from "./lib/common/auth";
import { createAgentFromTemplate } from "./lib/actions/create-agent-from-template";
import { createIdentity } from "./lib/actions/create-identity";
import { sendMessageToAgent } from "./lib/actions/send-message-to-agent";
import { getIdentities } from "./lib/actions/get-identities";
import { newAgent } from "./lib/triggers/new-agent";
import { newMessage } from "./lib/triggers/new-message";

export const letta = createPiece({
  displayName: "Letta",
  description: "Letta is the platform for building stateful agents: open AI with advanced memory that can learn and self-improve over time.",
  auth: lettaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/letta.png",
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["onyedikachi-david"],
  actions: [
    createAgentFromTemplate,
    createIdentity,
    sendMessageToAgent,
    getIdentities,
  ],
  triggers: [
    newAgent,
    newMessage,
  ],
});
     