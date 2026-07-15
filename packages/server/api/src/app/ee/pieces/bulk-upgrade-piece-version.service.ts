import { isNil, PlatformId, tryCatch, UserId } from '@activepieces/core-utils'
import {
    BulkUpgradePieceVersionFlowResult,
    BulkUpgradePieceVersionRequestBody,
    BulkUpgradePieceVersionResponse,
    FlowActionType,
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    flowPieceUtil,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersion,
    PieceAction,
    PieceTrigger,
    PopulatedFlow,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import pLimit from 'p-limit'
import { flowService } from '../../flows/flow/flow.service'
import { flowVersionValidationUtil } from '../../flows/flow-version/flow-version-validator-util'
import Paginator from '../../helper/pagination/paginator'
import { projectService } from '../../project/project-service'

const CONCURRENCY = 10

async function willFlowBeValidAfterBump({ flowVersion, bumpOperations, platformId, log }: WillFlowBeValidParams): Promise<boolean> {
    let version = flowVersion
    for (const operation of bumpOperations) {
        const prepared = await flowVersionValidationUtil(log).prepareRequest({ platformId, request: operation, userId: null })
        version = flowOperations.apply(version, prepared)
    }
    return version.valid
}

function buildBumpOperation(step: PieceAction | PieceTrigger, targetVersion: string): FlowOperationRequest {
    if (step.type === FlowTriggerType.PIECE) {
        return {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: { ...step, settings: { ...step.settings, pieceVersion: targetVersion } },
        }
    }
    return {
        type: FlowOperationType.UPDATE_ACTION,
        request: { ...step, settings: { ...step.settings, pieceVersion: targetVersion } },
    }
}

function findMatchingSteps({ flowVersion, pieceName, targetVersion }: FindMatchingStepsParams): (PieceAction | PieceTrigger)[] {
    return flowStructureUtil.getAllSteps(flowVersion.trigger).filter((step): step is PieceAction | PieceTrigger => {
        const isPieceStep = step.type === FlowActionType.PIECE || step.type === FlowTriggerType.PIECE
        return isPieceStep
            && step.settings.pieceName === pieceName
            && flowPieceUtil.getExactVersion(step.settings.pieceVersion) !== targetVersion
    })
}

async function classifyAndMaybeApply({ flow, pieceName, targetVersion, dryRun, platformId, userId, log }: ClassifyAndMaybeApplyParams): Promise<FlowOutcome | null> {
    const matchingSteps = findMatchingSteps({ flowVersion: flow.version, pieceName, targetVersion })
    if (matchingSteps.length === 0) {
        return null
    }
    const summary: BulkUpgradePieceVersionFlowResult = {
        flowId: flow.id,
        flowName: flow.version.displayName,
        projectId: flow.projectId,
        currentVersion: flowPieceUtil.getExactVersion(matchingSteps[0].settings.pieceVersion),
        matchingStepCount: matchingSteps.length,
    }

    const bumpOperations = matchingSteps.map((step) => buildBumpOperation(step, targetVersion))
    const willBeValid = await willFlowBeValidAfterBump({ flowVersion: flow.version, bumpOperations, platformId, log })
    if (!willBeValid) {
        return { kind: 'needsManual', summary }
    }
    if (dryRun) {
        return { kind: 'autoUpgradeable', summary }
    }

    for (const operation of bumpOperations) {
        await flowService(log).update({ id: flow.id, projectId: flow.projectId, platformId, userId, operation })
    }
    await flowService(log).update({
        id: flow.id,
        projectId: flow.projectId,
        platformId,
        userId,
        operation: { type: FlowOperationType.LOCK_AND_PUBLISH, request: { status: flow.status } },
    })
    return { kind: 'autoUpgradeable', summary }
}

export const bulkUpgradePieceVersionService = (log: FastifyBaseLogger) => ({
    async run({ platformId, request, userId }: RunParams): Promise<BulkUpgradePieceVersionResponse> {
        const { pieceName, targetVersion, dryRun, flowIds } = request
        const projectIds = await projectService(log).getProjectIdsByPlatform(platformId)
        if (projectIds.length === 0) {
            return { autoUpgradeable: [], needsManual: [], failed: [] }
        }

        const { data: flows } = await flowService(log).list({ projectIds, limit: Paginator.NO_LIMIT, includeTriggerSource: false })
        const candidates = flows.filter((flow) =>
            !isNil(flow.publishedVersionId) && (isNil(flowIds) || flowIds.includes(flow.id)),
        )

        const limit = pLimit(CONCURRENCY)
        const outcomes = await Promise.all(candidates.map((flow) => limit(async (): Promise<FlowOutcome | null> => {
            const { data, error } = await tryCatch(() => classifyAndMaybeApply({ flow, pieceName, targetVersion, dryRun, platformId, userId, log }))
            if (error) {
                return { kind: 'failed', failure: { flowId: flow.id, flowName: flow.version.displayName, message: error.message } }
            }
            return data
        })))

        return {
            autoUpgradeable: outcomes.flatMap((outcome) => outcome?.kind === 'autoUpgradeable' ? [outcome.summary] : []),
            needsManual: outcomes.flatMap((outcome) => outcome?.kind === 'needsManual' ? [outcome.summary] : []),
            failed: outcomes.flatMap((outcome) => outcome?.kind === 'failed' ? [outcome.failure] : []),
        }
    },
})

type WillFlowBeValidParams = {
    flowVersion: FlowVersion
    bumpOperations: FlowOperationRequest[]
    platformId: PlatformId
    log: FastifyBaseLogger
}

type FindMatchingStepsParams = {
    flowVersion: FlowVersion
    pieceName: string
    targetVersion: string
}

type ClassifyAndMaybeApplyParams = {
    flow: PopulatedFlow
    pieceName: string
    targetVersion: string
    dryRun: boolean
    platformId: PlatformId
    userId: UserId | null
    log: FastifyBaseLogger
}

type RunParams = {
    platformId: PlatformId
    userId: UserId | null
    request: BulkUpgradePieceVersionRequestBody
}

type FlowOutcome =
    | { kind: 'autoUpgradeable', summary: BulkUpgradePieceVersionFlowResult }
    | { kind: 'needsManual', summary: BulkUpgradePieceVersionFlowResult }
    | { kind: 'failed', failure: BulkUpgradePieceVersionResponse['failed'][number] }
