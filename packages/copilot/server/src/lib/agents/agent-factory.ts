import { BaseAgentConfig } from "@activepieces/copilot-shared";
import { AgentConfig, ToolDefinition } from "./agent";
import { findRelevantPieces } from "../tools/embeddings";
import { z } from "zod";

// Map of function names to their implementations
const toolImplementations: Record<string, (params: any) => Promise<any>> = {
  "findRelevantPieces": findRelevantPieces,
  // Add more tool implementations here
};

// Convert JSON Schema to Zod Schema
function jsonSchemaToZod(schema: any): z.ZodType<any> {
  if (schema.type === 'object') {
    const shape: Record<string, z.ZodType<any>> = {};
    for (const [key, value] of Object.entries(schema.properties || {})) {
      shape[key] = jsonSchemaToZod(value as any);
    }
    let zodObject = z.object(shape);
    if (schema.required) {
      zodObject = zodObject.required();
    }
    return zodObject;
  } else if (schema.type === 'string') {
    return z.string();
  } else if (schema.type === 'number') {
    return z.number();
  } else if (schema.type === 'boolean') {
    return z.boolean();
  } else if (schema.type === 'array') {
    return z.array(jsonSchemaToZod(schema.items));
  }
  return z.any();
}

export function createAgentConfig(baseConfig: BaseAgentConfig): AgentConfig<unknown> {
  // Convert tool definitions
  const tools: ToolDefinition[] = baseConfig.tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: jsonSchemaToZod(tool.parameters) as z.ZodObject<any>,
    execute: async (params: any) => {
      const implementation = toolImplementations[tool.function];
      if (!implementation) {
        throw new Error(`No implementation found for tool function: ${tool.function}`);
      }
      return implementation(params);
    }
  }));

  return {
    tools,
    defaultOptions: {
      model: baseConfig.model,
      temperature: baseConfig.temperature,
      maxSteps: baseConfig.maxSteps,
      systemPrompt: baseConfig.systemPrompt
    },
    outputSchema: jsonSchemaToZod(baseConfig.outputSchema)
  };
} 