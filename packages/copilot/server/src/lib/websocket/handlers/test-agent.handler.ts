import { Socket } from "socket.io";
import { AgentCommand, AgentCommandUpdate } from "@activepieces/copilot-shared";
import { createCommandHandler } from "./command-handler";
import { addResult, handleError } from "../../util/websocket-utils";
import { agentRegistry } from "../../agents/agent-registry";
import { createAgentFromConfig } from "../../agents/agent-factory";

interface TestAgentParams {
  agentName: string;
  prompt: string;
}

const handleTestAgent = async (socket: Socket, data: TestAgentParams): Promise<void> => {
  try {
    console.debug('[TestAgentHandler] Testing agent:', data.agentName, 'with prompt:', data.prompt);

    addResult(socket, {
      type: AgentCommandUpdate.AGENT_TEST_STARTED,
      data: {
        timestamp: new Date().toISOString(),
        agentName: data.agentName,
        prompt: data.prompt,
      }
    });

    // Get agent config from registry
    const baseConfig = agentRegistry.getConfig(data.agentName);
    if (!baseConfig) {
      throw new Error(`Agent not found: ${data.agentName}. Available agents: ${agentRegistry.getAllAgents().join(", ")}`);
    }

    // Convert base config to agent config and create agent
    const agent = createAgentFromConfig(baseConfig);
    const result = await agent?.execute(data.prompt, socket);

    addResult(socket, {
      type: AgentCommandUpdate.AGENT_TEST_COMPLETED,
      data: {
        timestamp: new Date().toISOString(),
        agentName: data.agentName,
        result
      }
    });

    console.debug('[TestAgentHandler] Test completed for agent:', data.agentName);
  } catch (error) {
    handleError(socket, error, `Testing agent: ${data.agentName}`);
  }
};

export const testAgentHandler = createCommandHandler(
  AgentCommand.TEST_AGENT,
  handleTestAgent
); 