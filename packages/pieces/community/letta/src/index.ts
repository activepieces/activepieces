import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/pieces-framework';
import { lettaAuth } from "./lib/common/auth";
import { createAgentFromTemplate } from "./lib/actions/create-agent-from-template";
import { createIdentity } from "./lib/actions/create-identity";
import { sendMessageToAgent } from "./lib/actions/send-message-to-agent";
import { getIdentities } from "./lib/actions/get-identities";
import { lettaListAgents } from './lib/actions/ai/list-agents';
import { lettaGetAgent } from './lib/actions/ai/get-agent';
import { lettaCreateAgent } from './lib/actions/ai/create-agent';
import { lettaUpdateAgent } from './lib/actions/ai/update-agent';
import { lettaDeleteAgent } from './lib/actions/ai/delete-agent';
import { lettaSendMessage } from './lib/actions/ai/send-message';
import { lettaListAgentMessages } from './lib/actions/ai/list-agent-messages';
import { lettaResetAgentMessages } from './lib/actions/ai/reset-agent-messages';
import { lettaGetRun } from './lib/actions/ai/get-run';
import { lettaListRunMessages } from './lib/actions/ai/list-run-messages';
import { lettaListAgentBlocks } from './lib/actions/ai/list-agent-blocks';
import { lettaGetAgentBlock } from './lib/actions/ai/get-agent-block';
import { lettaUpdateAgentBlock } from './lib/actions/ai/update-agent-block';
import { lettaAttachBlock } from './lib/actions/ai/attach-block';
import { lettaDetachBlock } from './lib/actions/ai/detach-block';
import { lettaListBlocks } from './lib/actions/ai/list-blocks';
import { lettaCreateBlock } from './lib/actions/ai/create-block';
import { lettaUpdateBlock } from './lib/actions/ai/update-block';
import { lettaDeleteBlock } from './lib/actions/ai/delete-block';
import { lettaListArchivalMemory } from './lib/actions/ai/list-archival-memory';
import { lettaInsertArchivalMemory } from './lib/actions/ai/insert-archival-memory';
import { lettaDeleteArchivalMemory } from './lib/actions/ai/delete-archival-memory';
import { lettaListTools } from './lib/actions/ai/list-tools';
import { lettaListAgentTools } from './lib/actions/ai/list-agent-tools';
import { lettaAttachTool } from './lib/actions/ai/attach-tool';
import { lettaDetachTool } from './lib/actions/ai/detach-tool';
import { lettaListModels } from './lib/actions/ai/list-models';
import { lettaListTags } from './lib/actions/ai/list-tags';
import { newAgent } from "./lib/triggers/new-agent";
import { newMessage } from "./lib/triggers/new-message";

export const letta = createPiece({
  displayName: "Letta",
  description: "Letta is the platform for building stateful agents: open AI with advanced memory that can learn and self-improve over time.",
  auth: lettaAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: "https://cdn.activepieces.com/pieces/letta.png",
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["onyedikachi-david"],
  actions: [
    createAgentFromTemplate,
    createIdentity,
    sendMessageToAgent,
    getIdentities,
    lettaListAgents,
    lettaGetAgent,
    lettaCreateAgent,
    lettaUpdateAgent,
    lettaDeleteAgent,
    lettaSendMessage,
    lettaListAgentMessages,
    lettaResetAgentMessages,
    lettaGetRun,
    lettaListRunMessages,
    lettaListAgentBlocks,
    lettaGetAgentBlock,
    lettaUpdateAgentBlock,
    lettaAttachBlock,
    lettaDetachBlock,
    lettaListBlocks,
    lettaCreateBlock,
    lettaUpdateBlock,
    lettaDeleteBlock,
    lettaListArchivalMemory,
    lettaInsertArchivalMemory,
    lettaDeleteArchivalMemory,
    lettaListTools,
    lettaListAgentTools,
    lettaAttachTool,
    lettaDetachTool,
    lettaListModels,
    lettaListTags,
  ],
  triggers: [
    newAgent,
    newMessage,
  ],
});
     