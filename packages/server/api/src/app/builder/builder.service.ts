import { AIUsageFeature, createAIModel } from '@activepieces/common-ai'
import {
    assertNotNullOrUndefined,
    FlowAction,
    flowStructureUtil,
    FlowTrigger,
    FlowVersion,
    FlowVersionState,
} from '@activepieces/shared'
import { openai } from '@ai-sdk/openai'
import { generateText, GenerateTextResult, stepCountIs } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { flowService } from '../flows/flow/flow.service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { domainHelper } from '../helper/domain-helper'
import { buildBuilderTools } from './builder.tools'

/*
 * Strips a FlowVersion of unnecessary metadata before sending it to the AI model.
 * The goal is to reduce token usage and prevent the model from being distracted
 * by attributes it doesn’t need to know in order to reason about the flow.
 *
 * Example of final stripped format:
 *
 * {
 *   "displayName": "test",
 *   "trigger": {
 *     "name": "trigger",
 *     "type": "PIECE_TRIGGER",
 *     "valid": false,
 *     "settings": {
 *       "pieceName": "@activepieces/piece-slack",
 *       "triggerName": "new-message",
 *       "pieceVersion": "~0.10.2"
 *     },
 *     "nextAction": {
 *       "name": "send_email",
 *       "type": "PIECE",
 *       "settings": {
 *         "pieceName": "@activepieces/piece-gmail",
 *         "actionName": "send_email",
 *         "pieceVersion": "~0.8.4"
 *       },
 *       "nextAction": {
 *         "name": "send_request",
 *         "type": "PIECE",
 *         "settings": {
 *           "pieceName": "@activepieces/piece-http",
 *           "actionName": "send_request",
 *           "pieceVersion": "~0.8.4"
 *         }
 *       }
 *     }
 *   }
 * }
 */
const stripFlowVersionForAiPrompt = (flowVersion: FlowVersion): string => {
    // Traverse the flow structure and clean each step
    const minimalFlowVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
        const cleaned = { ...step }

        // Remove unneeded step settings metadata
        if (cleaned.settings) {
            delete cleaned.settings.errorHandlingOptions
            delete cleaned.settings.inputUiInfo
            delete cleaned.settings.connectionIds
            delete cleaned.settings.agentIds
            delete cleaned.settings.input
            delete cleaned.settings.inputUiInfo // duplicate remove to be safe
        }

        // Remove extra fields from triggers
        if (flowStructureUtil.isTrigger(cleaned.type)) {
            delete (cleaned as Partial<FlowTrigger>).displayName
        }

        // Remove extra fields from actions
        if (flowStructureUtil.isAction(cleaned.type)) {
            delete (cleaned as Partial<FlowAction>).valid
            delete (cleaned as Partial<FlowAction>).displayName
        }

        return cleaned
    })

    // Remove top-level metadata that’s irrelevant to the AI
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created, updated, flowId, connectionIds, agentIds, updatedBy, valid, state, schemaVersion, ...rest } = minimalFlowVersion

    // Return as pretty-printed JSON for easier reading in the prompt
    return JSON.stringify(rest, null, 2)
}


export const builderService = (log: FastifyBaseLogger) => ({
    async runAndUpdate({ userId, projectId, platformId, flowId, messages }: RunParams): Promise<GenerateTextResult<ReturnType<typeof buildBuilderTools>, string>> {
        await flowService(log).getOneOrThrow({
            projectId,
            id: flowId,
        })
        const flowVersion = await flowVersionService(log).getLatestVersion(flowId, FlowVersionState.DRAFT)
        assertNotNullOrUndefined(flowVersion, 'No draft flow version found')

        const engineToken = await accessTokenManager.generateEngineToken({
            projectId,
            platformId,
        })
        const baseURL = await domainHelper.getPublicApiUrl({ path: '/v1/ai-providers/proxy/openai', platformId })
        const system = `You are a workflow builder agent.

            A workflow or "flow" consists of "steps" which integrate to external services called "pieces".
            A piece can have multiple triggers and actions.
            A flow consists of one trigger step and multiple action steps beneath it.
            A flow is represented in JSON format.
            A trigger step should always be named "trigger" whereas action step names must be unique in a flow and simple (ex. "step_1", "step_2" etc)

            You have been provided with atomic tools to modify a flow by updating trigger and action steps.

            Here's what you should do
            1. User may not provide fully qualified piece names, so you should first find pieceName and pieceVersion using the "list-pieces" tool
            2. To find the correct actionName or triggerName for a given pieceName, use the "get-piece-information" tool
            3. Identify where to add the required action by asking the user the "parentStepName" used in "add-action" tool

            Important: If you're unsure of a pieceName, triggerName or parentStepName - please ask the user
            `
        const systemWithFlowPrompt = `
            ${system}

            Here's the current flow:

            ${stripFlowVersionForAiPrompt(flowVersion)}
            `
        const model = createAIModel({
            providerName: 'openai',
            modelInstance: openai('gpt-4.1'),
            engineToken,
            baseURL,
            metadata: {
                feature: AIUsageFeature.TEXT_AI,
            },
        })
        const result = await generateText({
            model,
            stopWhen: stepCountIs(10),
            messages: [
                { role: 'system', content: systemWithFlowPrompt },
                ...messages,
            ],
            tools: buildBuilderTools({ userId, projectId, platformId, flowId, flowVersionId: flowVersion.id }),
        })
        return result
    },
})

type ChatMessage = {
    role: 'system' | 'user' | 'assistant'
    content: string
}

type RunParams = {
    userId: string
    projectId: string
    platformId: string
    flowId: string
    messages: ChatMessage[]
}
