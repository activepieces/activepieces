import { BaseAgentConfig } from "@activepieces/copilot-shared";
import plannerConfig from "./planner.json";

// Import all agent configs here
const agentConfigs = new Map<string, BaseAgentConfig>([
  ["planner", plannerConfig as BaseAgentConfig],
  // Add more agents here as needed
]);

export const agentRegistry = {
  getConfig: (agentName: string): BaseAgentConfig | undefined => {
    return agentConfigs.get(agentName);
  },

  hasAgent: (agentName: string): boolean => {
    return agentConfigs.has(agentName);
  },

  getAllAgents: (): string[] => {
    return Array.from(agentConfigs.keys());
  }
}; 