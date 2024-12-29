import { BaseAgentConfig } from "@activepieces/copilot-shared";
import { Agent, AgentConfig, ToolDefinition, createAgent } from "./agent";
import { toolFunctions } from "../tools";
import { z } from "zod";

// =================== Types ===================
type ToolConfig = BaseAgentConfig['tools'][0];
export type { BaseAgentConfig };

// =================== Schema Conversion ===================
function jsonSchemaToZod(schema: any): z.ZodType<any> {
  if (!schema) return z.any();
  
  switch (schema.type) {
    case 'object': {
      const shape: Record<string, z.ZodType<any>> = {};
      for (const [key, value] of Object.entries(schema.properties || {})) {
        shape[key] = jsonSchemaToZod(value as any);
      }
      let zodObject = z.object(shape);
      if (schema.required) {
        zodObject = zodObject.required();
      }
      return zodObject;
    }
    case 'string': return z.string();
    case 'number': return z.number();
    case 'boolean': return z.boolean();
    case 'array': return z.array(jsonSchemaToZod(schema.items));
    default: return z.any();
  }
}

// =================== Tool Factory ===================
function createToolFromConfig(toolConfig: ToolConfig): ToolDefinition {
  const toolFunction = toolFunctions[toolConfig.function as keyof typeof toolFunctions];
  if (!toolFunction) {
    throw new Error(`Tool function ${toolConfig.function} not found`);
  }

  const parameters = jsonSchemaToZod(toolConfig.parameters);
  if (!(parameters instanceof z.ZodObject)) {
    throw new Error(`Tool parameters must be an object schema`);
  }

  return {
    name: toolConfig.name,
    description: toolConfig.description,
    parameters,
    execute: toolFunction,
  };
}

// =================== Agent Factory ===================
export function createAgentFromConfig<T>(config: BaseAgentConfig): Agent<T> | null {
  if (!config.enabled) {
    console.debug('[Agent] Agent is disabled');
    return null;
  }

  const outputSchema = jsonSchemaToZod(config.outputSchema);

  const agentConfig: AgentConfig<T> = {
    tools: config.tools.map(createToolFromConfig),
    defaultOptions: {
      model: config.model,
      maxSteps: config.maxSteps,
      systemPrompt: config.systemPrompt,
      temperature: config.temperature,
    },
    outputSchema,
  };

  return createAgent<T>(agentConfig);
} 