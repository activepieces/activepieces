import { httpClient, AuthenticationType, HttpMethod } from "@activepieces/pieces-common";
import { Agent, SeekPage, ContentBlockType, agentbuiltInToolsNames, AgentStepBlock, isNil, ToolCallContentBlock, McpWithTools, AgentOutputType, AgentOutputFieldType, ToolCallType, McpToolType, assertNotNullOrUndefined } from "@activepieces/shared"
import { experimental_createMCPClient, tool } from "ai";
import { StatusCodes } from "http-status-codes";
import z, { ZodRawShape, ZodSchema } from "zod";

async function getStructuredOutput(agent: Agent): Promise<ZodSchema> {
    const outputFields = agent.outputFields ?? []
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
    return {
        [agentbuiltInToolsNames.markAsComplete]: tool({
            description: 'Mark the todo as complete',
            inputSchema: params.agent.outputType === AgentOutputType.STRUCTURED_OUTPUT ? z.object({
                output: await getStructuredOutput(params.agent),
            }) : z.object({}),
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
    const mcpTools = isNil(mcpClient) ? {} : await mcpClient.tools()
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
    publicUrl: string
    token: string
    mcp: McpWithTools
    agent: Agent
}