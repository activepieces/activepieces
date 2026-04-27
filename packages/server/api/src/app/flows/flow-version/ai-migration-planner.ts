import { PropertyType } from '@activepieces/pieces-framework'
import {
    AgentPieceProps,
    AgentProviderModelSchema,
    aiPieceSupportsWebSearch,
    AIProviderModelType,
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
import { getPiecePackageWithoutArchive, pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { findCompatiblePieceVersion } from './ai-piece-version-resolver'
import { DynamicSchemaCache, dynamicSchemaResolver } from './dynamic-schema-resolver'

export async function planFlowVersionChanges({
    flowVersion,
    sourceModel,
    targetModel,
    aiProviderModelType,
    platformId,
    projectId,
    cache,
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

        const piecePackage = await getPiecePackageWithoutArchive(log, platformId, {
            pieceName: step.settings.pieceName,
            pieceVersion: resolved.pieceVersion,
        })
        const targetMetadata = await pieceMetadataService(log).getOrThrow({
            name: step.settings.pieceName,
            version: resolved.pieceVersion,
            platformId,
        })
        const targetActionProps = targetMetadata.actions[actionName]?.props ?? {}
        const isWebSearchAware = AgentPieceProps.WEB_SEARCH in targetActionProps

        let newInput: Record<string, unknown> = withProviderModel({ input, actionName, targetModel })

        let clearedAdvancedOptions = false
        let disabledWebSearch = false

        if (isWebSearchAware) {
            const currentWebSearch = Boolean(newInput[AgentPieceProps.WEB_SEARCH])
            if (currentWebSearch && !aiPieceSupportsWebSearch(resolved.effectiveTargetProvider)) {
                newInput = { ...newInput, [AgentPieceProps.WEB_SEARCH]: false }
                disabledWebSearch = true
            }
        }

        const fieldsTouched = fieldsTouchedByMigration(actionName, disabledWebSearch)
        const targetLabel = `${resolved.effectiveTargetProvider}/${targetModel.model}`

        let blockedReason: string | undefined
        for (const [propName, propMeta] of Object.entries(targetActionProps)) {
            if (propMeta.type !== PropertyType.DYNAMIC) {
                continue
            }
            const refreshers = propMeta.refreshers ?? []
            if (!refreshersIntersect(refreshers, fieldsTouched)) {
                continue
            }
            const resolvedSchema = await dynamicSchemaResolver.resolve({
                cache,
                piece: piecePackage,
                actionName,
                propName,
                refreshers,
                input: newInput,
                platformId,
                projectId,
                log,
            })
            const merged = dynamicSchemaResolver.merge({
                schema: resolvedSchema,
                oldMap: input[propName] as Record<string, unknown> | undefined,
                propName,
                stepName: step.name,
                targetLabel,
            })
            if (merged.verdict === 'blocked') {
                blockedReason = merged.reason
                break
            }
            newInput = { ...newInput, [propName]: merged.resolved }
            if (propName === 'advancedOptions') {
                clearedAdvancedOptions = true
            }
        }

        if (!isNil(blockedReason)) {
            changes.push({
                stepName: step.name,
                error: blockedReason,
            })
            continue
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

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function fieldsTouchedByMigration(actionName: string, disabledWebSearch: boolean): Set<string> {
    const fields = new Set<string>(
        actionName === RUN_AGENT_ACTION ? [AgentPieceProps.AI_PROVIDER_MODEL] : ['provider', 'model'],
    )
    if (disabledWebSearch) {
        fields.add(AgentPieceProps.WEB_SEARCH)
    }
    return fields
}

function refreshersIntersect(refreshers: string[], fieldsTouched: Set<string>): boolean {
    return refreshers.some((r) => fieldsTouched.has(r))
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
    cache: DynamicSchemaCache
    log: FastifyBaseLogger
}

const RUN_AGENT_ACTION = 'run_agent'
const TEXT_ACTION_NAMES = ['askAi', 'summarizeText', 'classifyText', 'extractStructuredData', RUN_AGENT_ACTION]
const IMAGE_ACTION_NAMES = ['generateImage']
