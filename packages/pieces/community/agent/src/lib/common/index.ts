import { AIUsageFeature, createAIModel, SUPPORTED_AI_PROVIDERS } from "@activepieces/common-ai";
import { AgentTool, ToolCallContentBlock, ToolCallBase, ToolCallType, assertNotNullOrUndefined, AgentToolType } from "@activepieces/shared"
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

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
                assertNotNullOrUndefined(tool.flowId, 'Flow ID is required')
                return {
                    ...baseTool,
                    toolCallType: ToolCallType.FLOW,
                    displayName: 'Unknown',
                    flowId: tool.flowId,
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
    tools: AgentTool[];
    baseTool: ToolCallBase;
}