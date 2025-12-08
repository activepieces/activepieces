import { createPiece } from "@activepieces/pieces-framework";
import { runSingleAgent } from "./lib/actions/run-single-agent.action";
import { runMultiStepAgent } from "./lib/actions/run-multi-step-agent.action";

export const langchainAiFree = createPiece({
  displayName: "LangChain AI Free",
  description: "Single-step and multi-step AI agent for Activepieces.",
  logoUrl: "https://multiagentpro.ai/logo.png",
  authors: ["lau90eth"],

  // ⚡ new framework versions: no category + no auth required
  auth: undefined,

  actions: [
    runSingleAgent,
    runMultiStepAgent
  ],

  triggers: [],
});
