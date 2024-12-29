import { Socket } from "socket.io";
import { AgentCommand, AgentCommandUpdate } from "@activepieces/copilot-shared";
import { createCommandHandler } from "./command-handler";
import { addResult } from "../../util/websocket-utils";
import { agentRegistry } from "../../agents/agent-registry";
import { createAgentFromConfig } from "../../agents/agent-factory";

interface TestAgentParams {
  agentName: string;
  prompt: string;
  testId: string;
}

const handleTestAgent = async (socket: Socket, data: TestAgentParams): Promise<void> => {
  try {
    console.debug('[TestAgentHandler] Testing agent:', data.agentName, 'with prompt:', data.prompt, 'testId:', data.testId);

    addResult(socket, {
      type: AgentCommandUpdate.AGENT_TEST_STARTED,
      data: {
        timestamp: new Date().toISOString(),
        agentName: data.agentName,
        prompt: data.prompt,
        testId: data.testId
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
        result,
        testId: data.testId,
        prompt: data.prompt
      }
    });

    console.debug('[TestAgentHandler] Test completed for agent:', data.agentName, 'testId:', data.testId);
  } catch (error) {
    console.error('[TestAgentHandler] Error testing agent:', data.agentName, 'testId:', data.testId, error);
    addResult(socket, {
      type: AgentCommandUpdate.AGENT_TEST_ERROR,
      data: {
        timestamp: new Date().toISOString(),
        agentName: data.agentName,
        error: error instanceof Error ? error.message : 'Unknown error',
        testId: data.testId,
        prompt: data.prompt
      }
    });
  }
};

export const testAgentHandler = createCommandHandler(
  AgentCommand.TEST_AGENT,
  handleTestAgent
); 