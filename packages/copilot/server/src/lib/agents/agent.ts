import { Socket } from "socket.io";
import { z } from 'zod';
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';

// =================== Types and Interfaces ===================
export interface AgentOptions {
  model?: string;
  maxSteps?: number;
  systemPrompt?: string;
  temperature?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  execute: (params: any, options?: { abortSignal?: AbortSignal }) => Promise<any>;
}

export interface AgentConfig<T> {
  tools: ToolDefinition[];
  defaultOptions?: AgentOptions;
  outputSchema: z.ZodType<T>;
  answerDescription?: string; // Custom description for the answer tool
}

// =================== Constants ===================
const DEFAULT_OPTIONS: AgentOptions = {
  model: 'gpt-4o',
  maxSteps: 10,
  systemPrompt: 'You are a helpful AI assistant.',
  temperature: 0.7,
};

const DEFAULT_ANSWER_DESCRIPTION = 'Provide the final structured response.';

// =================== Helper Functions ===================
function createAnswerTool<T>(schema: z.ZodType<T>, description: string): ToolDefinition {
  const objectSchema = schema instanceof z.ZodObject ? schema : z.object({ result: schema });
  return {
    name: 'answer',
    description,
    parameters: objectSchema,
    execute: async (params: T) => params,
  };
}

function initializeTools<T>(
  toolDefinitions: ToolDefinition[],
  outputSchema: z.ZodType<T>,
  answerDescription: string
): Record<string, any> {
  const tools: Record<string, any> = {};
  
  // First, add all custom tools
  for (const def of toolDefinitions) {
    if (def.name === 'answer') {
      console.warn('[Agent] Ignoring custom answer tool. The answer tool is automatically created based on the output schema.');
      continue;
    }
    tools[def.name] = tool({
      description: def.description,
      parameters: def.parameters,
      execute: async (params: any, options: { abortSignal?: AbortSignal }) => {
        try {
          console.debug(`[${def.name}] Executing with params:`, params);
          const result = await def.execute(params, options);
          return result;
        } catch (error) {
          console.error(`[${def.name}] Error executing tool:`, error);
          throw error;
        }
      },
    });
  }

  // Always add the answer tool last
  const answerTool = createAnswerTool(outputSchema, answerDescription);
  tools[answerTool.name] = tool({
    description: answerTool.description,
    parameters: answerTool.parameters,
    execute: answerTool.execute,
  });

  return tools;
}

// =================== Agent Creation ===================
export function createAgent<T>(config: AgentConfig<T>) {
  const answerDescription = config.answerDescription || DEFAULT_ANSWER_DESCRIPTION;
  let currentTools = initializeTools(config.tools, config.outputSchema, answerDescription);
  let currentOptions = { ...DEFAULT_OPTIONS, ...config.defaultOptions };
  let currentConfig = config;

  const execute = async (prompt: string, socket: Socket | null, options?: AgentOptions): Promise<T> => {
    const executionOptions = { ...currentOptions, ...options };
    console.debug('[Agent] Starting execution with prompt:', prompt);

    try {
      const { toolCalls } = await generateText({
        model: openai(executionOptions.model!, { structuredOutputs: true }),
        tools: currentTools,
        toolChoice: 'required',
        maxSteps: executionOptions.maxSteps,
        system: executionOptions.systemPrompt,
        temperature: executionOptions.temperature,
        prompt,
      });

      console.debug('[Agent] Generated tool calls:', JSON.stringify(toolCalls, null, 2));

      // Get the last tool call as the final result
      const finalCall = toolCalls[toolCalls.length - 1];
      if (!finalCall) {
        throw new Error('No tool calls generated');
      }

      if (finalCall.toolName !== 'answer') {
        throw new Error('Final tool call must be the answer tool');
      }

      // Validate the output against the schema
      const result = currentConfig.outputSchema.parse(finalCall.args);
      return result;

    } catch (error) {
      console.error('[Agent] Error during execution:', error);
      throw new Error('Failed to execute agent plan');
    }
  };

  const updateConfig = (newConfig: Partial<AgentConfig<T>>) => {
    if (newConfig.tools || newConfig.outputSchema) {
      currentTools = initializeTools(
        newConfig.tools || currentConfig.tools,
        newConfig.outputSchema || currentConfig.outputSchema,
        newConfig.answerDescription || currentConfig.answerDescription || DEFAULT_ANSWER_DESCRIPTION
      );
    }
    if (newConfig.defaultOptions) {
      currentOptions = { ...currentOptions, ...newConfig.defaultOptions };
    }
    if (newConfig.outputSchema) {
      currentConfig = { ...currentConfig, outputSchema: newConfig.outputSchema };
    }
  };

  const addTool = (toolDef: ToolDefinition) => {
    if (toolDef.name === 'answer') {
      throw new Error('Cannot add a custom answer tool. The answer tool is automatically created based on the output schema.');
    }
    const newTools = initializeTools(
      [...Object.values(currentTools), toolDef],
      currentConfig.outputSchema,
      currentConfig.answerDescription || DEFAULT_ANSWER_DESCRIPTION
    );
    currentTools = newTools;
  };

  const removeTool = (toolName: string) => {
    if (toolName === 'answer') {
      throw new Error('Cannot remove the answer tool. It is required for structured output.');
    }
    const { [toolName]: removed, ...remainingTools } = currentTools;
    currentTools = remainingTools;
  };

  return {
    execute,
    updateConfig,
    addTool,
    removeTool,
  };
}

// =================== Helper Types ===================
export type AgentExecutor<T> = (prompt: string, socket: Socket | null, options?: AgentOptions) => Promise<T>;

export interface Agent<T> {
  execute: AgentExecutor<T>;
  updateConfig?: (newConfig: Partial<AgentConfig<T>>) => void;
  addTool?: (tool: ToolDefinition) => void;
  removeTool?: (toolName: string) => void;
}
