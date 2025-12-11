import { AIUsageFeature, createAIModel, SUPPORTED_AI_PROVIDERS } from "@activepieces/common-ai";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { LanguageModelV2 } from '@ai-sdk/provider'
import { AgentTool, ToolCallContentBlock, ToolCallBase, ToolCallType, assertNotNullOrUndefined, AgentToolType, PopulatedFlow, SeekPage, isNil, McpTrigger, McpProperty, McpPropertyType, ExecuteToolResponse, ExecutionToolStatus, TASK_COMPLETION_TOOL_NAME, AgentOutputField, AgentOutputFieldType } from "@activepieces/shared"
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { z, ZodObject } from "zod/v4";

type AIModel = {
    id: string
    provider: string
    displayName: string
    modelName: string
}

export const AI_MODELS: AIModel[] = SUPPORTED_AI_PROVIDERS.flatMap(provider =>
    provider.languageModels.map(model => ({
        id: `${provider.provider}-${model.instance.modelId}`,
        provider: provider.provider,
        displayName: model.displayName,
        modelName: model.instance.modelId,
    }))
)

function fixProperty(schemaName: string) {
    return schemaName.replace(/[\s/@-]+/g, '_')
}

export const agentCommon = {
    getToolMetadata({ toolName, tools, baseTool }: GetToolMetadaParams ): ToolCallContentBlock {
        const tool = tools.find((tool) => tool.toolName === toolName)
        assertNotNullOrUndefined(tool, `Tool ${toolName} not found`)

        switch (tool.type) {
            case AgentToolType.PIECE: {
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
            case AgentToolType.FLOW: {
                assertNotNullOrUndefined(tool.externalFlowId, 'Flow ID is required')
                return {
                    ...baseTool,
                    toolCallType: ToolCallType.FLOW,
                    displayName: tool.toolName,
                    externalFlowId: tool.externalFlowId,
                }
            }
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
    createModel(params: CreateAIModelParams): LanguageModelV2 {
        const { baseURL, flowId, model, token } = params
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
    async constructFlowsTools(params: ConstructFlowsTools) {
        const flowTools = params.agentToolsMetadata.filter(tool => tool.type === AgentToolType.FLOW)
        const flowExternalIds = flowTools.map((tool) => tool.externalFlowId)
        const flows = await params.fetchFlows({ externalIds: flowExternalIds })

        const flowToolsWithPopulatedFlows = flowTools.map((tool) => {
            const populatedFlow = flows.data.find(f => f.externalId === tool.externalFlowId);
            return !isNil(populatedFlow) ? { ...tool, flow: populatedFlow } : undefined
        }).filter(tool => !isNil(tool));

        const flowsToolsList = await Promise.all(flowToolsWithPopulatedFlows.map(async (tool) => {
            const triggerSettings = tool.flow.version.trigger.settings as McpTrigger
            const toolDescription = triggerSettings.input?.toolDescription
            const returnsResponse = triggerSettings.input?.returnsResponse

            const inputSchema = Object.fromEntries(
                triggerSettings.input?.inputSchema.map(prop => [
                    fixProperty(prop.name),
                    mcpPropertyToSchema(prop),
                ]),
            )
            return {
                name: tool.toolName,
                description: toolDescription,
                inputSchema: z.object(inputSchema),
                execute: async (_inputs: unknown) => {
                    return runMcpFlowTool({
                        flowId: tool.flow.id,
                        publicUrl: params.publicUrl,
                        token: params.token,
                        async: !returnsResponse
                    }) 
                }
            }
        }))

        return {
            ...Object.fromEntries(flowsToolsList.map((tool) => [tool.name, tool])),
        }
    },
    isTaskCompletionToolCall(toolName: string): boolean {
        return toolName === TASK_COMPLETION_TOOL_NAME
    },
    structuredOutputSchema(outputFields: AgentOutputField[]): ZodObject | undefined {
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

        return Object.keys(shape).length > 0 ? z.object(shape) : undefined;
    }
}

function isOkSuccess(status: number) {
    return Math.floor(status / 100) === 2
}

function mcpPropertyToSchema(property: McpProperty): z.ZodTypeAny {
    let schema: z.ZodTypeAny

    switch (property.type) {
        case McpPropertyType.TEXT:
        case McpPropertyType.DATE:
            schema = z.string()
            break
        case McpPropertyType.NUMBER:
            schema = z.number()
            break
        case McpPropertyType.BOOLEAN:
            schema = z.boolean()
            break
        case McpPropertyType.ARRAY:
            schema = z.array(z.string())
            break
        case McpPropertyType.OBJECT:
            schema = z.record(z.string(), z.string())
            break
        default:
            schema = z.unknown()
    }

    if (property.description) {
        schema = schema.describe(property.description)
    }

    return property.required ? schema : schema.nullish()
}

export async function runMcpFlowTool(params: ExecuteMcpFlowTool): Promise<ExecuteToolResponse> {
    const syncSuffix = params.async ? '' : '/sync';

    const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${params.publicUrl}v1/webhooks/${params.flowId}${syncSuffix}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: params.token,
        },
    });

    return {
        status: isOkSuccess(response.status) ? ExecutionToolStatus.SUCCESS : ExecutionToolStatus.FAILED,
        output: response.body,
        resolvedInput: {},
        errorMessage: !isOkSuccess(response.status) ? 'Error' : undefined,
    }
}

type ConstructFlowsTools = {
    agentToolsMetadata: AgentTool[]
    fetchFlows: (params: { externalIds: string[] }) => Promise<SeekPage<PopulatedFlow>>
    publicUrl: string;
    token: string
}

type ExecuteMcpFlowTool = {
    flowId: string;
    token: string;
    publicUrl: string;
    async: boolean;
}

type CreateAIModelParams = {
    model: AIModel;
    token: string;
    baseURL: string;
    flowId: string;
}

type GetToolMetadaParams = {
    toolName: string;
    tools: AgentTool[];
    baseTool: ToolCallBase;
}