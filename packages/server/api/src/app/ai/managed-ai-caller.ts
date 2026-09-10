import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils'
import { AI_PIECE_COST_BILLING_VERSION, AI_PIECE_NAME, FlowActionType, flowStructureUtil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import semver from 'semver'
import { flowService } from '../flows/flow/flow.service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'

async function assertReportsCost({ projectId, flowVersionId, stepName, pieceVersion, log }: AssertReportsCostParams): Promise<void> {
    const step = await resolveStep({ projectId, flowVersionId, stepName, log })
    if (isNil(step)) {
        log.info({ project: { id: projectId }, flowVersion: { id: flowVersionId }, step: { name: stepName }, piece: { version: pieceVersion } }, '[managedAiCaller] No stored step to check this caller against, falling back to the version it reports for itself')
        assertVersionReportsCost({ pieceVersion })
        return
    }
    if (step.pieceName !== AI_PIECE_NAME) {
        log.warn({ project: { id: projectId }, step: { name: stepName }, piece: { name: step.pieceName } }, '[managedAiCaller] Refused a managed AI key to a step that is not the AI piece')
        throw refusal(`Only ${AI_PIECE_NAME} may use the Activepieces AI provider.`)
    }
    assertVersionReportsCost({ pieceVersion: step.pieceVersion })
}

async function resolveStep({ projectId, flowVersionId, stepName, log }: ResolveStepParams): Promise<ResolvedStep | undefined> {
    if (isNil(flowVersionId) || isNil(stepName)) {
        return undefined
    }
    const flowVersion = await flowVersionService(log).getOne(flowVersionId)
    if (isNil(flowVersion)) {
        return undefined
    }
    const flow = await flowService(log).getOne({ id: flowVersion.flowId, projectId })
    if (isNil(flow)) {
        log.warn({ project: { id: projectId }, flowVersion: { id: flowVersionId } }, '[managedAiCaller] Refused a caller naming a flow version outside its own project')
        throw refusal('That flow version does not belong to this project.')
    }
    const step = flowStructureUtil.getStep(stepName, flowVersion.trigger)
    if (isNil(step) || step.type !== FlowActionType.PIECE) {
        return undefined
    }
    return { pieceName: step.settings.pieceName, pieceVersion: step.settings.pieceVersion }
}

function assertVersionReportsCost({ pieceVersion }: { pieceVersion?: string }): void {
    const caller = isNil(pieceVersion) ? null : semver.coerce(pieceVersion)
    if (!isNil(caller) && semver.gte(caller, AI_PIECE_COST_BILLING_VERSION)) {
        return
    }
    throw refusal(`The Activepieces AI provider requires ${AI_PIECE_NAME} ${AI_PIECE_COST_BILLING_VERSION} or newer, because older versions cannot report what a call costs. Republish this flow to pick up the current version.`)
}

function refusal(message: string): ActivepiecesError {
    return new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message } })
}

export const managedAiCaller = { assertReportsCost }

type ResolvedStep = {
    pieceName: string
    pieceVersion: string
}

type ResolveStepParams = {
    projectId: string
    flowVersionId?: string
    stepName?: string
    log: FastifyBaseLogger
}

type AssertReportsCostParams = ResolveStepParams & {
    pieceVersion?: string
}
