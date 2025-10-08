import { AIUsageFeature, createAIModel } from "@activepieces/common-ai";
import { httpClient, AuthenticationType, HttpMethod } from "@activepieces/pieces-common";
import { Agent, SeekPage, ContentBlockType, agentbuiltInToolsNames, AgentStepBlock, isNil, ToolCallContentBlock, McpWithTools, AgentOutputType, AgentOutputFieldType, ToolCallType, McpToolType, assertNotNullOrUndefined, AgentOutputField, McpTool } from "@activepieces/shared"
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { type Schema as AiSchema, experimental_createMCPClient, tool } from "ai";
import { StatusCodes } from "http-status-codes";
import z, { ZodRawShape, ZodSchema } from "zod";

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
    const mcpServer = params.mcp
    if (mcpServer.tools.length === 0) {
        return null
    }
    const mcpServerUrl = `${params.publicUrl}v1/mcp/${params.mcp.token}/sse`
    return experimental_createMCPClient({
        transport: {
            type: 'sse',
            url: mcpServerUrl,
        },
    })
}

export const agentCommon = {
  listAgents(params: ListAgents) {
    return httpClient.sendRequest<SeekPage<Agent>>({
      method: HttpMethod.GET,
      url: `${params.publicUrl}v1/agents`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: params.token,
      },
    })
  },
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
  createModelForProvider<P extends AIProvider>({
    provider,
    model,
    token,
    baseURL,
    agentId,
  }: CreateModelParams<P>) {
    const providerInstance = {
      [AIProvider.OPENAI]: openai(model as OpenAIModel),
      [AIProvider.ANTHROPIC]: anthropic(model as AnthropicModel),
      [AIProvider.GOOGLE]: google(model as GoogleModel),
    }[provider];

    return createAIModel({
      providerName: provider,
      modelInstance: providerInstance,
      engineToken: token,
      baseURL,
      metadata: {
        feature: AIUsageFeature.AGENTS,
        agentid: agentId,
      },
    });
  },
  async getAgent(params: GetAgent) {
    const { agentId, apiUrl , token } = params;
    const response = await httpClient.sendRequest<Agent>({
      method: HttpMethod.GET,
      url: `${apiUrl}v1/agents/${agentId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      }
    })
    if (response.status !== StatusCodes.OK) {
      throw new Error("There was an error fetching agent")
    }

    return response.body
  },
  getMetadata(toolName: string, mcp: McpWithTools, baseTool: Pick<ToolCallContentBlock, 'startTime' | 'endTime' | 'input' | 'output' | 'status' | 'toolName' | 'toolCallId' | 'type'>): ToolCallContentBlock {
    if (toolName === agentbuiltInToolsNames.markAsComplete || toolName === agentbuiltInToolsNames.updateTableRecord) {
        return {
            ...baseTool,
            toolCallType: ToolCallType.INTERNAL,
            displayName: toolName === agentbuiltInToolsNames.markAsComplete ? 'Mark as Complete' : 'Update Table Record',
        }
    }
    const tool = mcp.tools.find((tool) => tool.toolName === toolName)
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
  async getMcp(params: GetMcp) {
    const { mcpId, apiUrl , token } = params;

    const response = await httpClient.sendRequest<McpWithTools>({
      method: HttpMethod.GET,
      url: `${apiUrl}v1/mcp-servers/${mcpId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      }
    })
    
    if (response.status !== StatusCodes.OK) {
      throw new Error("There was an error fetching agent")
    }

    return response.body
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

type ListAgents = {
  publicUrl: string
  token: string
}

type GetAgent = {
  agentId: string;
  apiUrl: string;
  token: string
}

type GetMcp = {
  mcpId: string;
  apiUrl: string;
  token: string
}

type AgentToolsParams = {
    outputFields: AgentOutputField[]
    publicUrl: string
    mcp: McpWithTools
    token: string
    tools: McpTool[]
}

type CreateModelParams<P extends AIProvider> = {
  provider: P;
  model: ProviderModelMap[P];
  token: string;
  baseURL: string;
  agentId: string;
}

export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
}

export enum OpenAIModel {
  GPT_4_1 = 'gpt-4.1',
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
}

export enum AnthropicModel {
  CLAUDE_3_OPUS = 'claude-3-opus',
  CLAUDE_3_SONNET = 'claude-3-sonnet',
  CLAUDE_3_HAIKU = 'claude-3-haiku',
}

export enum GoogleModel {
  GEMINI_1_5_PRO = 'gemini-1.5-pro',
  GEMINI_1_5_FLASH = 'gemini-1.5-flash',
}

export type ProviderModelMap = {
  [AIProvider.OPENAI]: OpenAIModel;
  [AIProvider.ANTHROPIC]: AnthropicModel;
  [AIProvider.GOOGLE]: GoogleModel;
};

export const AI_MODELS_BY_PROVIDER: Record<AIProvider, { label: string; value: string }[]> = {
  [AIProvider.OPENAI]: [
    { label: 'GPT-4.1', value: OpenAIModel.GPT_4_1 },
    { label: 'GPT-4 Turbo', value: OpenAIModel.GPT_4_TURBO },
    { label: 'GPT-3.5 Turbo', value: OpenAIModel.GPT_3_5_TURBO },
  ],
  [AIProvider.ANTHROPIC]: [
    { label: 'Claude 3 Opus', value: AnthropicModel.CLAUDE_3_OPUS },
    { label: 'Claude 3 Sonnet', value: AnthropicModel.CLAUDE_3_SONNET },
    { label: 'Claude 3 Haiku', value: AnthropicModel.CLAUDE_3_HAIKU },
  ],
  [AIProvider.GOOGLE]: [
    { label: 'Gemini 1.5 Pro', value: GoogleModel.GEMINI_1_5_PRO },
    { label: 'Gemini 1.5 Flash', value: GoogleModel.GEMINI_1_5_FLASH },
  ],
};
