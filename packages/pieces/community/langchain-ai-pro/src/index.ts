import { createPiece } from "@activepieces/pieces-framework";
import { runMultiAgent } from "./lib/actions/run-multi-agent.action";

export const langchainAiPro = createPiece({
  displayName: "LangChain AI Pro",
  description:
    "Advanced multi-agent orchestration, vector memory, routing, caching and PRO-only features.",
  logoUrl: "https://multiagentpro.ai/logo.png",
  authors: ["lau90eth"],
  auth: undefined,
  actions: [runMultiAgent],
  triggers: [],
});
export * from './lib/langchain-ai-pro';
