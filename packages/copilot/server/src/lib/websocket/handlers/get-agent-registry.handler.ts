import { Socket } from "socket.io";
import { AgentCommand, AgentCommandUpdate, WebsocketChannelTypes } from "@activepieces/copilot-shared";
import { createCommandHandler } from "./command-handler";
import { addResult, handleError } from "../../util/websocket-utils";
import { agentRegistry } from "../../agents/agent-registry";

const handleGetAgentRegistry = async (socket: Socket): Promise<void> => {
  try {
    
    const agents = agentRegistry.getAllAgents().reduce((acc, agentName) => {
      const config = agentRegistry.getConfig(agentName);
      if (config) {
        acc[agentName] = config;
      }
      return acc;
    }, {} as Record<string, any>);
    addResult(socket, {
      type: AgentCommandUpdate.AGENT_REGISTRY_UPDATED,
      data: agents,
    });

  } catch (error) {
    handleError(socket, error, 'Getting agent registry');
  }
};

export const getAgentRegistryHandler = createCommandHandler(
  AgentCommand.GET_AGENT_REGISTRY,
  handleGetAgentRegistry
); 