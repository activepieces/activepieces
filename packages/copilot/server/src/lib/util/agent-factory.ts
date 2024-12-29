import { Agent, AgentConfig, ToolDefinition, createAgent } from '../agents/agent';
import { toolFunctions } from '../tools';
import { createSystemPrompt, createOutputSchema, createParameterSchema } from '../agents/agent-config';

// =================== Types ===================
export interface ToolConfig {
  name: string;
  function: string;
  description: string;
  parameters: any;
}

export interface BaseAgentConfig {
  enabled: boolean;
  model: string;
  maxSteps: number;
  temperature: number;
  tools: ToolConfig[];
  systemPrompt: string;
  guidelines?: string[];
  requirements?: string[];
  outputSchema: any;
  answerDescription?: string;
}

// =================== Tool Factory ===================
export function createToolFromConfig(toolConfig: ToolConfig): ToolDefinition {
  const toolFunction = toolFunctions[toolConfig.function as keyof typeof toolFunctions];
  if (!toolFunction) {
    throw new Error(`Tool function ${toolConfig.function} not found`);
  }

  return {
    name: toolConfig.name,
    description: toolConfig.description,
    parameters: createParameterSchema(toolConfig.parameters),
    execute: toolFunction,
  };
}

// =================== Agent Factory ===================
export function createAgentFromConfig<T>(config: BaseAgentConfig): Agent<T> | null {
  if (!config.enabled) {
    console.debug('[Agent] Agent is disabled');
    return null;
  }

  const agentConfig: AgentConfig<T> = {
    tools: config.tools.map(createToolFromConfig),
    defaultOptions: {
      model: config.model,
      maxSteps: config.maxSteps,
      systemPrompt: createSystemPrompt(config),
      temperature: config.temperature,
    },
    outputSchema: createOutputSchema<T>(config),
    answerDescription: config.answerDescription,
  };

  return createAgent<T>(agentConfig);
} 