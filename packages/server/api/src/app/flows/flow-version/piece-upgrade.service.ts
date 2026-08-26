import { isNil, spreadIfDefined, unique } from '@activepieces/core-utils'
import { ApplicationEventName, Flow, FlowAction, FlowActionType, FlowPiecesUpgradedEvent, flowStructureUtil, FlowTrigger, FlowTriggerType, FlowVersion } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { AuditEventEntity } from '../../ee/audit-logs/audit-event-entity'
import { applicationEvents } from '../../helper/application-events'
import { projectService } from '../../project/project-service'
import { flowRepo } from '../flow/flow.repo'
import { flowVersionRepo } from './flow-version.service'
import { pieceUpgradeRegister } from './piece-upgrade-register'

export const pieceUpgradeService = (log: FastifyBaseLogger) => ({
    async upgradeFlows({ flowIds, projectId }: UpgradeFlowsParams): Promise<FlowPieceUpgradeResult[]> {
        return Promise.all(unique(flowIds).map((flowId) => upgradeFlow({ flowId, projectId, log })))
    },
    async revertFlows({ flowIds }: RevertFlowsParams): Promise<FlowPieceUpgradeResult[]> {
        return Promise.all(unique(flowIds).map((flowId) => revertFlow({ flowId, log })))
    },
})

const auditEventRepo = repoFactory(AuditEventEntity)

async function revertFlow({ flowId, log }: RevertFlowParams): Promise<FlowPieceUpgradeResult> {
    const flow = await flowRepo().findOneBy({ id: flowId })
    if (isNil(flow)) {
        return { flowId, found: false, upgradedSteps: [] }
    }
    const platformId = await projectService(log).getPlatformId(flow.projectId)
    const events = await auditEventRepo().createQueryBuilder('event')
        .where('event.platformId = :platformId', { platformId })
        .andWhere('event.action = :action', { action: ApplicationEventName.FLOW_PIECES_UPGRADED })
        .andWhere('event.data->>\'flowId\' = :flowId', { flowId })
        .orderBy('event.created', 'DESC')
        .getMany()
    const upgradeEvents = events.map((event) => FlowPiecesUpgradedEvent.shape.data.parse(event.data))
    if (upgradeEvents.length === 0) {
        return { flowId, found: false, upgradedSteps: [] }
    }

    const revertsByVersion = new Map<string, Map<string, StepRevert>>()
    for (const eventData of upgradeEvents) {
        const versionReverts = revertsByVersion.get(eventData.flowVersionId) ?? new Map<string, StepRevert>()
        for (const step of eventData.steps) {
            if (step.decision === 'UPGRADED' && !isNil(step.newVersion) && !versionReverts.has(step.stepName)) {
                versionReverts.set(step.stepName, { prevVersion: step.prevVersion, newVersion: step.newVersion })
            }
        }
        revertsByVersion.set(eventData.flowVersionId, versionReverts)
    }

    const revertedSteps: UpgradedStep[] = []
    for (const [flowVersionId, versionReverts] of revertsByVersion) {
        const flowVersion = await flowVersionRepo().findOneBy({ id: flowVersionId, flowId })
        if (isNil(flowVersion)) {
            continue
        }
        revertedSteps.push(...await revertFlowVersion({ flow, platformId, flowVersion, versionReverts, log }))
    }
    return { flowId, found: true, upgradedSteps: revertedSteps }
}

async function revertFlowVersion({ flow, platformId, flowVersion, versionReverts, log }: RevertFlowVersionParams): Promise<UpgradedStep[]> {
    const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    const applied = steps.flatMap((step) => {
        if (step.type !== FlowActionType.PIECE && step.type !== FlowTriggerType.PIECE) {
            return []
        }
        const revert = versionReverts.get(step.name)
        const usedStepName = getUsedStepName(step)
        if (isNil(revert) || isNil(usedStepName) || step.settings.pieceVersion !== revert.newVersion) {
            return []
        }
        return [{
            flowVersionId: flowVersion.id,
            stepName: step.name,
            pieceName: step.settings.pieceName,
            actionOrTriggerName: usedStepName,
            fromVersion: revert.newVersion,
            toVersion: revert.prevVersion,
        }]
    })
    if (applied.length === 0) {
        return []
    }
    const stepNameToPrevVersion = Object.fromEntries(applied.map((step) => [step.stepName, step.toVersion]))
    const newFlowVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
        const prevVersion = stepNameToPrevVersion[step.name]
        if (isNil(prevVersion)) {
            return step
        }
        return {
            ...step,
            settings: {
                ...step.settings,
                pieceVersion: prevVersion,
            },
        }
    })
    await flowVersionRepo().update(flowVersion.id, { trigger: newFlowVersion.trigger })

    applicationEvents(log).sendUserEvent({ platformId, projectId: flow.projectId }, {
        action: ApplicationEventName.FLOW_PIECES_REVERTED,
        data: {
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            steps: applied.map((step) => ({
                stepName: step.stepName,
                actionOrTriggerName: step.actionOrTriggerName,
                prevVersion: step.fromVersion,
                newVersion: step.toVersion,
            })),
        },
    })

    return applied.map(({ actionOrTriggerName: _actionOrTriggerName, ...upgradedStep }) => upgradedStep)
}

async function upgradeFlow({ flowId, projectId, log }: UpgradeFlowParams): Promise<FlowPieceUpgradeResult> {
    const flow = await flowRepo().findOneBy({ id: flowId, ...spreadIfDefined('projectId', projectId) })
    if (isNil(flow)) {
        return { flowId, found: false, upgradedSteps: [] }
    }
    const latestVersion = await flowVersionRepo().findOne({ where: { flowId }, order: { created: 'DESC' } })
    const versions = [latestVersion]
    if (!isNil(flow.publishedVersionId) && flow.publishedVersionId !== latestVersion?.id) {
        versions.push(await flowVersionRepo().findOneBy({ id: flow.publishedVersionId }))
    }
    const upgradedSteps: UpgradedStep[] = []
    for (const version of versions) {
        if (isNil(version)) {
            continue
        }
        upgradedSteps.push(...await upgradeFlowVersion({ flow, flowVersion: version, log }))
    }
    return { flowId, found: true, upgradedSteps }
}

async function upgradeFlowVersion({ flow, flowVersion, log }: UpgradeFlowVersionParams): Promise<UpgradedStep[]> {
    const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)

    const decisions: StepUpgradeDecision[] = []
    for (const step of steps) {
        const decision = await resolveStepDecision({ step, flowVersion, log })
        if (!isNil(decision)) {
            decisions.push(decision)
        }
    }
    if (decisions.length === 0) {
        return []
    }

    const upgraded = decisions.filter((decision): decision is UpgradedStepDecision => decision.decision === 'UPGRADED')
    if (upgraded.length > 0) {
        const stepNameToNewVersion = Object.fromEntries(upgraded.map((decision) => [decision.stepName, decision.newVersion]))
        const newFlowVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            const newVersion = stepNameToNewVersion[step.name]
            if (isNil(newVersion)) {
                return step
            }
            return {
                ...step,
                settings: {
                    ...step.settings,
                    pieceVersion: newVersion,
                },
            }
        })
        await flowVersionRepo().update(flowVersion.id, { trigger: newFlowVersion.trigger })
    }

    const platformId = await projectService(log).getPlatformId(flow.projectId)
    applicationEvents(log).sendUserEvent({ platformId, projectId: flow.projectId }, {
        action: ApplicationEventName.FLOW_PIECES_UPGRADED,
        data: {
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            steps: decisions.map(toLogStep),
        },
    })

    return upgraded.map((decision) => ({
        flowVersionId: flowVersion.id,
        stepName: decision.stepName,
        pieceName: decision.pieceName,
        fromVersion: decision.prevVersion,
        toVersion: decision.newVersion,
    }))
}

function toLogStep(decision: StepUpgradeDecision): PieceUpgradeAuditStep {
    return {
        stepName: decision.stepName,
        actionOrTriggerName: decision.actionOrTriggerName,
        decision: decision.decision,
        prevVersion: decision.prevVersion,
        newVersion: decision.newVersion,
    }
}

async function resolveStepDecision({ step, flowVersion, log }: ResolveStepDecisionParams): Promise<StepUpgradeDecision | undefined> {
    if (step.type !== FlowActionType.PIECE && step.type !== FlowTriggerType.PIECE) {
        return undefined
    }
    const usedStepName = getUsedStepName(step)
    if (isNil(usedStepName)) {
        return undefined
    }
    const { pieceName, pieceVersion } = step.settings
    const logContext = {
        flowVersion: { id: flowVersion.id },
        step: { name: step.name },
        piece: { name: pieceName, version: pieceVersion },
    }

    const entry = await pieceUpgradeRegister.lookup({ pieceName, pieceVersion, log })
    if (isNil(entry)) {
        log.info(logContext, '[pieceUpgradeService] piece version not in upgrade register, keeping current version')
        return undefined
    }

    const base = {
        stepName: step.name,
        pieceName,
        actionOrTriggerName: usedStepName,
        prevVersion: pieceVersion,
    }
    const decision = pieceUpgradeRegister.resolveDecision({ entry, usedStepName })
    switch (decision.outcome) {
        case 'upgraded':
            log.info({ ...logContext, upgrade: { toVersion: decision.toVersion } }, '[pieceUpgradeService] piece upgrade pass')
            return { ...base, decision: 'UPGRADED', newVersion: decision.toVersion }
        case 'kept':
            log.warn({ ...logContext, upgrade: { target: entry.target, flaggedStep: usedStepName } }, '[pieceUpgradeService] step flagged unsafe in upgrade register, keeping current version')
            return { ...base, decision: 'KEPT', newVersion: null }
    }
}

function getUsedStepName(step: FlowAction | FlowTrigger): string | undefined {
    if (step.type === FlowTriggerType.PIECE) {
        return step.settings.triggerName ?? undefined
    }
    if (step.type === FlowActionType.PIECE) {
        return step.settings.actionName ?? undefined
    }
    return undefined
}

export type UpgradedStep = {
    flowVersionId: string
    stepName: string
    pieceName: string
    fromVersion: string
    toVersion: string
}

export type FlowPieceUpgradeResult = {
    flowId: string
    found: boolean
    upgradedSteps: UpgradedStep[]
}

type PieceUpgradeAuditStep = {
    stepName: string
    actionOrTriggerName: string
    decision: 'UPGRADED' | 'KEPT'
    prevVersion: string
    newVersion: string | null
}

type StepUpgradeDecisionBase = {
    stepName: string
    pieceName: string
    actionOrTriggerName: string
    prevVersion: string
}

type UpgradedStepDecision = StepUpgradeDecisionBase & {
    decision: 'UPGRADED'
    newVersion: string
}

type KeptStepDecision = StepUpgradeDecisionBase & {
    decision: 'KEPT'
    newVersion: null
}

type StepUpgradeDecision = UpgradedStepDecision | KeptStepDecision

type UpgradeFlowsParams = {
    flowIds: string[]
    projectId?: string
}

type RevertFlowsParams = {
    flowIds: string[]
}

type RevertFlowParams = {
    flowId: string
    log: FastifyBaseLogger
}

type StepRevert = {
    prevVersion: string
    newVersion: string
}

type RevertFlowVersionParams = {
    flow: Flow
    platformId: string
    flowVersion: FlowVersion
    versionReverts: Map<string, StepRevert>
    log: FastifyBaseLogger
}

type UpgradeFlowParams = {
    flowId: string
    projectId?: string
    log: FastifyBaseLogger
}

type UpgradeFlowVersionParams = {
    flow: Flow
    flowVersion: FlowVersion
    log: FastifyBaseLogger
}

type ResolveStepDecisionParams = {
    step: FlowAction | FlowTrigger
    flowVersion: FlowVersion
    log: FastifyBaseLogger
}
