import { AIUsageFeature, createAIModel, SUPPORTED_AI_PROVIDERS } from "@activepieces/common-ai";
import { AgentOutputFieldType, AgentOutputField, McpTool, ToolCallContentBlock, ToolCallBase, ToolCallType, McpToolType, assertNotNullOrUndefined } from "@activepieces/shared"
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { Output } from 'ai';
import z, { ZodType } from "zod";
import { ZodTypeDef } from "zod/v3";

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

export const agentCommon = {
    async collectStream<T>(stream: AsyncIterable<T>): Promise<T> {
        const chunks: T[] = []
        for await (const chunk of stream) {
            chunks.push(chunk)
        }
        return chunks[chunks.length - 1]
    },

    getToolMetadata({ toolName, tools, baseTool }: GetToolMetadaParams ): ToolCallContentBlock {
        if (toolName === 'markAsFinish') {
            return {
                ...baseTool,
                toolCallType: ToolCallType.INTERNAL,
                displayName: 'Mark as Complete'
            }
        }

        const tool = tools.find((tool) => tool.toolName === toolName)
        assertNotNullOrUndefined(tool, `Tool ${toolName} not found`)

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
    getStructuredOutputSchema(
        outputFields: AgentOutputField[]
    ): ReturnType<typeof Output.object> | undefined {
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

        return Object.keys.length > 0 ? Output.object({
            schema: z.object(shape) as ZodType<Record<string, unknown>, ZodTypeDef, any>,
        }) : undefined;
    },

    getModelById(modelId: string): AIModel {
        const model = AI_MODELS.find(m => m.id === modelId);
        if (!model) {
            const availableModels = AI_MODELS.map(m => m.id).join(', ');
            throw new Error(`Model "${modelId}" not found. Available models: ${availableModels}`);
        }
        return model;
    },
    createModel(params: CreateAIModelParams) {
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
}

type CreateAIModelParams = {
    model: AIModel;
    token: string;
    baseURL: string;
    flowId: string;
}

type GetToolMetadaParams = {
    toolName: string;
    tools: McpTool[];
    baseTool: ToolCallBase;
}