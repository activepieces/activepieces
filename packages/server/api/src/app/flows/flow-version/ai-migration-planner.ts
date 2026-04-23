import {
    AgentPieceProps,
    AgentProviderModelSchema,
    AIProviderModelType,
    AIProviderName,
    FlowActionType,
    FlowOperationRequest,
    FlowOperationType,
    flowStructureUtil,
    FlowVersion,
    isNil,
    PlatformId,
    ProjectId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { findCompatiblePieceVersion } from './ai-piece-version-resolver'

export async function planFlowVersionChanges({
    flowVersion,
    sourceModel,
    targetModel,
    aiProviderModelType,
    platformId,
    projectId,
    log,
}: PlanFlowVersionChangesParams): Promise<PlannedStepChange[]> {
    const scopedActionNames = aiProviderModelType === AIProviderModelType.IMAGE
        ? IMAGE_ACTION_NAMES
        : TEXT_ACTION_NAMES

    const allSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    const changes: PlannedStepChange[] = []

    for (const step of allSteps) {
        if (!flowStructureUtil.isAgentPiece(step) || step.type !== FlowActionType.PIECE) {
            continue
        }
        const actionName = step.settings.actionName
        if (isNil(actionName) || !scopedActionNames.includes(actionName)) {
            continue
        }

        const input = step.settings.input
        const { provider: stepProvider, model: stepModel } = readStepProviderModel({ input, actionName })
        if (stepProvider !== sourceModel.provider || stepModel !== sourceModel.model) {
            continue
        }

        const currentPieceVersion = step.settings.pieceVersion
        const resolved = await findCompatiblePieceVersion({
            platformId,
            projectId,
            targetProvider: targetModel.provider,
            targetModel: targetModel.model,
            log,
        })

        if (isNil(resolved.pieceVersion) || isNil(resolved.effectiveTargetProvider)) {
            const targetProviderLabel = resolved.effectiveTargetProvider ?? targetModel.provider
            const minRequired = resolved.minRequiredPieceVersion ?? '0.0.1'
            changes.push({
                stepName: step.name,
                error: `Step ${step.name} blocked: current piece version ${currentPieceVersion} does not support ${targetProviderLabel}. Install @activepieces/piece-ai@${minRequired} or later.`,
            })
            continue
        }

        let newInput: Record<string, unknown> = withProviderModel({ input, actionName, targetModel })

        let clearedAdvancedOptions = false
        let disabledWebSearch = false

        if (actionName === 'generateImage' && sourceModel.provider !== targetModel.provider) {
            newInput = { ...newInput, advancedOptions: {} }
            clearedAdvancedOptions = true
        }

        if (WEB_SEARCH_AWARE_ACTIONS.includes(actionName)) {
            const currentWebSearch = Boolean(newInput.webSearch)
            if (currentWebSearch && !providerSupportsWebSearch(resolved.effectiveTargetProvider)) {
                newInput = { ...newInput, webSearch: false, webSearchOptions: {} }
                disabledWebSearch = true
            }
        }

        const { sampleData: _sampleData, ...settingsWithoutSampleData } = step.settings
        const operation: FlowOperationRequest = {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                ...step,
                settings: {
                    ...settingsWithoutSampleData,
                    pieceVersion: resolved.pieceVersion,
                    input: newInput,
                },
            },
        }

        changes.push({
            stepName: step.name,
            operation,
            diff: {
                pieceVersionFrom: currentPieceVersion,
                pieceVersionTo: resolved.pieceVersion,
                clearedAdvancedOptions,
                disabledWebSearch,
            },
        })
    }

    return changes
}

function readStepProviderModel({ input, actionName }: {
    input: Record<string, unknown>
    actionName: string
}): { provider: string | undefined, model: string | undefined } {
    if (actionName === RUN_AGENT_ACTION) {
        const nested = input[AgentPieceProps.AI_PROVIDER_MODEL]
        if (!isRecord(nested)) {
            return { provider: undefined, model: undefined }
        }
        return {
            provider: typeof nested.provider === 'string' ? nested.provider : undefined,
            model: typeof nested.model === 'string' ? nested.model : undefined,
        }
    }
    return {
        provider: typeof input.provider === 'string' ? input.provider : undefined,
        model: typeof input.model === 'string' ? input.model : undefined,
    }
}

function withProviderModel({ input, actionName, targetModel }: {
    input: Record<string, unknown>
    actionName: string
    targetModel: AgentProviderModelSchema
}): Record<string, unknown> {
    if (actionName === RUN_AGENT_ACTION) {
        return { ...input, [AgentPieceProps.AI_PROVIDER_MODEL]: targetModel }
    }
    return { ...input, provider: targetModel.provider, model: targetModel.model }
}

function providerSupportsWebSearch(provider: AIProviderName): boolean {
    return !PROVIDERS_WITHOUT_WEB_SEARCH.has(provider)
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export type PlannedStepChange =
    | { stepName: string, operation: FlowOperationRequest, diff: StepDiff, error?: never }
    | { stepName: string, error: string, operation?: never, diff?: never }

export type StepDiff = {
    pieceVersionFrom: string
    pieceVersionTo: string
    clearedAdvancedOptions: boolean
    disabledWebSearch: boolean
}

export type PlanFlowVersionChangesParams = {
    flowVersion: FlowVersion
    sourceModel: AgentProviderModelSchema
    targetModel: AgentProviderModelSchema
    aiProviderModelType: AIProviderModelType
    platformId: PlatformId
    projectId: ProjectId
    log: FastifyBaseLogger
}

const RUN_AGENT_ACTION = 'run_agent'
const TEXT_ACTION_NAMES = ['askAi', 'summarizeText', 'classifyText', 'extractStructuredData', RUN_AGENT_ACTION]
const IMAGE_ACTION_NAMES = ['generateImage']
const WEB_SEARCH_AWARE_ACTIONS = ['askAi', RUN_AGENT_ACTION]

const PROVIDERS_WITHOUT_WEB_SEARCH: ReadonlySet<AIProviderName> = new Set([
    AIProviderName.AZURE,
    AIProviderName.CUSTOM,
    AIProviderName.BEDROCK,
    AIProviderName.CLOUDFLARE_GATEWAY,
])
