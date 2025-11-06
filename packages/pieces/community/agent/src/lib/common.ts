import { AIUsageFeature, createAIModel, SUPPORTED_AI_PROVIDERS } from "@activepieces/common-ai";
import { ContentBlockType, agentbuiltInToolsNames, AgentStepBlock, isNil, ToolCallContentBlock, AgentOutputFieldType, ToolCallType, McpToolType, assertNotNullOrUndefined, AgentOutputField, McpTool } from "@activepieces/shared"
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { type Schema as AiSchema, tool, experimental_createMCPClient } from "ai";
import z, { ZodSchema } from "zod";
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export const AI_MODELS: AIModel[] = SUPPORTED_AI_PROVIDERS.flatMap(provider =>
    provider.languageModels.map(model => ({
        id: `${provider.provider}-${model.instance.modelId}`,
        provider: provider.provider,
        displayName: model.displayName,
        modelName: model.instance.modelId,
    }))
)

export type AIModel = {
    id: string
    provider: string
    displayName: string
    modelName: string
}

async function getStructuredOutput(outputFields: AgentOutputField[]): Promise<ZodSchema> {
    const shape: Record<string, z.ZodType> = {}
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

export const agentCommon = {
    async agentTools(params: AgentToolsParams) {

        const mcpServerUrl = `${params.apiUrl}v1/flows/${params.flowId}/versions/${params.flowVersionId}/steps/${params.stepName}/mcp`

        const transport = new StreamableHTTPClientTransport(new URL(mcpServerUrl), {
            requestInit: {
                headers: {
                    'Authorization': `Bearer ${params.token}`,
                },
            }
        })
        const mcpClient = await experimental_createMCPClient({ transport })

        const builtInTools = await buildInternalTools(params)
        const mcpTools = isNil(mcpClient) || params.tools.length === 0 ? {} : await mcpClient.tools()
        return {
            tools: async () => {
                return {
                    ...builtInTools,
                    ...mcpTools
                }
            },
            close: async () => {
                await mcpClient?.close()
            },
        }
    },
    getModelById(modelId: string): AIModel {
        const model = AI_MODELS.find(m => m.id === modelId);
        if (!model) {
            const availableModels = AI_MODELS.map(m => m.id).join(', ');
            throw new Error(`Model "${modelId}" not found. Available models: ${availableModels}`);
        }
        return model;
    },
    createModel({
        model,
        token,
        baseURL,
        flowId,
    }: {
        model: AIModel;
        token: string;
        baseURL: string;
        flowId: string;
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
                feature: AIUsageFeature.MCP,
                mcpid: `flow:${flowId}`,
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
    You are an autonomous assistant designed to efficiently accomplish the user's goal.

    ### Core Directives:
    1. **Always** perform the requested task before calling the \`mark as complete\` tool.  
    2. **Always** call the \`mark as complete\` tool after finishing a task or answering a question — even if it fails.  
    - Include the output, result, or failure reason in the call.  
    3. After using **any tool** (except \`mark as complete\`), you must **immediately provide a one-line explanation** of what you did with that tool.  
    - If the tool call fails, briefly explain **why** it failed.  
    4. Be concise, factual, and action-driven. Avoid unnecessary explanations.

    **Current Date:** ${new Date().toISOString()}  
    (Use this to interpret time-based queries like “this week” or “due tomorrow.”)

    ---

    ${systemPrompt}
    `.trim();
    }
}


type AgentToolsParams = {
    outputFields: AgentOutputField[]
    apiUrl: string
    token: string
    tools: McpTool[]
    flowId: string
    flowVersionId: string
    stepName: string
}