import { AIUsageFeature, createAIModel } from "@activepieces/common-ai";
import {  ContentBlockType, agentbuiltInToolsNames, AgentStepBlock, isNil, ToolCallContentBlock, McpWithTools, AgentOutputType, AgentOutputFieldType, ToolCallType, McpToolType, assertNotNullOrUndefined, AgentOutputField, McpTool } from "@activepieces/shared"
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { type Schema as AiSchema, experimental_createMCPClient, tool } from "ai";
import z, { ZodRawShape, ZodSchema } from "zod";

export const AI_MODELS = [
  { id: 'openai-gpt-4.1', provider: 'openai', displayName: 'GPT-4.1', modelName: 'gpt-4.1' },
  { id: 'openai-gpt-4-turbo', provider: 'openai', displayName: 'GPT-4 Turbo', modelName: 'gpt-4-turbo' },
  { id: 'openai-gpt-3.5-turbo', provider: 'openai', displayName: 'GPT-3.5 Turbo', modelName: 'gpt-3.5-turbo' },
  
  { id: 'anthropic-claude-3-opus', provider: 'anthropic', displayName: 'Claude 3 Opus', modelName: 'claude-3-opus' },
  { id: 'anthropic-claude-3-sonnet', provider: 'anthropic', displayName: 'Claude 3 Sonnet', modelName: 'claude-3-sonnet' },
  { id: 'anthropic-claude-3-haiku', provider: 'anthropic', displayName: 'Claude 3 Haiku', modelName: 'claude-3-haiku' },
  
  { id: 'google-gemini-1.5-pro', provider: 'google', displayName: 'Gemini 1.5 Pro', modelName: 'gemini-1.5-pro' },
  { id: 'google-gemini-1.5-flash', provider: 'google', displayName: 'Gemini 1.5 Flash', modelName: 'gemini-1.5-flash' },
] as const;

type AIModel = typeof AI_MODELS[number];

async function getStructuredOutput(outputFields: AgentOutputField[]): Promise<ZodSchema> {
    const shape: ZodRawShape = {}
    for (const field of outputFields) {
        switch (field.type) {
            case AgentOutputFieldType.TEXT:
                shape[field.displayName] = z.string()
                break
            case AgentOutputFieldType.NUMBER:
                shape[field.displayName] = z.number()
                break
            case AgentOutputFieldType.BOOLEAN:
                shape[field.displayName] = z.boolean()
                break
            default:
                shape[field.displayName] = z.any()
        }
    }
    return z.object(shape)
}  

async function buildInternalTools(params: AgentToolsParams) {
    const structuredOutput = await getStructuredOutput(params.outputFields)
    const inputSchema: ZodSchema = params.outputFields.length > 0
        ? z.object({ output: structuredOutput }) as ZodSchema
        : z.object({})
        
    return {
        [agentbuiltInToolsNames.markAsComplete]: tool({
            description: 'Mark the todo as complete',
            inputSchema: inputSchema as unknown as AiSchema,
            execute: async () => {
                return 'Marked as Complete'
            },
        }),
    }
}

async function getMcpClient(params: AgentToolsParams) {
    const mcpServerUrl = `${params.publicUrl}v1/flows/${params.flowId}/mcp-server`
    return experimental_createMCPClient({
        transport: {
            type: 'sse',
            url: mcpServerUrl,
        },
    })
}

export const agentCommon = {
  async agentTools(params: AgentToolsParams) {
    const mcpClient = await getMcpClient(params)
    const builtInTools = await buildInternalTools(params)
    const mcpTools = isNil(mcpClient) ? {} : params.tools
    const tools = {
        ...builtInTools,
        ...mcpTools,
    }
    return {
        tools: async () => {
            return tools
        },
        close: async () => {
            await mcpClient?.close()
        },
    }
  },
  getModelById(modelId: string): AIModel {
    const model = AI_MODELS.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    return model;
  },
  createModel({
    model,
    token,
    baseURL,
    agentId,
  }: {
    model: AIModel;
    token: string;
    baseURL: string;
    agentId: string;
  }) {
    const providerInstances = {
      openai: () => openai(model.modelName),
      anthropic: () => anthropic(model.modelName),
      google: () => google(model.modelName),
    };

    const providerInstance = providerInstances[model.provider as keyof typeof providerInstances]();

    return createAIModel({
      providerName: model.provider,
      modelInstance: providerInstance,
      engineToken: token,
      baseURL,
      metadata: {
        feature: AIUsageFeature.AGENTS,
        agentid: agentId,
      },
    });
  },
  getMetadata(toolName: string, tools: McpTool[], baseTool: Pick<ToolCallContentBlock, 'startTime' | 'endTime' | 'input' | 'output' | 'status' | 'toolName' | 'toolCallId' | 'type'>): ToolCallContentBlock {
    if (toolName === agentbuiltInToolsNames.markAsComplete || toolName === agentbuiltInToolsNames.updateTableRecord) {
        return {
            ...baseTool,
            toolCallType: ToolCallType.INTERNAL,
            displayName: toolName === agentbuiltInToolsNames.markAsComplete ? 'Mark as Complete' : 'Update Table Record',
        }
    }
    const tool = tools.find((tool) => tool.toolName === toolName)
    if (!tool) {
        throw new Error(`Tool ${toolName} not found`)
    }
    switch (tool.type) {
        case McpToolType.PIECE: {
            const pieceMetadata = tool.pieceMetadata
            assertNotNullOrUndefined(pieceMetadata, 'Piece metadata is required')
            return {
                ...baseTool,
                toolCallType: ToolCallType.PIECE,
                pieceName: pieceMetadata.pieceName,
                pieceVersion: pieceMetadata.pieceVersion,
                actionName: tool.pieceMetadata.actionName,
            }
        }
        case McpToolType.FLOW: {
            assertNotNullOrUndefined(tool.flowId, 'Flow ID is required')
            return {
                ...baseTool,
                toolCallType: ToolCallType.FLOW,
                displayName: tool.flow?.version?.displayName ?? 'Unknown',
                flowId: tool.flowId,
            }
        }
    }
  },
  isMarkAsComplete(block: any): boolean {
    return block.type === ContentBlockType.TOOL_CALL && block.toolName === agentbuiltInToolsNames.markAsComplete
  },
  concatMarkdown(blocks: AgentStepBlock[]): string {
    return blocks
      .filter((block) => block.type === ContentBlockType.MARKDOWN)
      .map((block) => block.markdown)
      .join('\n')
  },

  constructSystemPrompt(systemPrompt: string): string {
    return `
You are an autonomous assistant designed to efficiently achieve the user's goal.
YOU MUST ALWAYS call the mark as complete tool with the output or message wether you have successfully completed the task or not.
You MUST ALWAYS do the requested task before calling the mark as complete tool.
**Today's Date**: ${new Date().toISOString()}  
Use this to interpret time-based queries like "this week" or "due tomorrow."
---
${systemPrompt}
    `.trim()
  },
}

type AgentToolsParams = {
    outputFields: AgentOutputField[]
    publicUrl: string
    token: string
    tools: McpTool[]
    flowId: string
}
