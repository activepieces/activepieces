import { Socket } from "socket.io";
import { AgentCommand, WebsocketChannelTypes } from "@activepieces/copilot-shared";
import { createCommandHandler } from "./command-handler";
import { handleError } from "../../util/websocket-utils";
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

    socket.emit(WebsocketChannelTypes.RESPONSE_GET_AGENT_REGISTRY, agents);
  } catch (error) {
    handleError(socket, error, 'Getting agent registry');
  }
};

export const getAgentRegistryHandler = createCommandHandler(
  AgentCommand.GET_AGENT_REGISTRY,
  handleGetAgentRegistry
); 