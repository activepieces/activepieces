import { isNil, spreadIfDefined, unique } from '@activepieces/core-utils'
import { ApplicationEventName, Flow, FlowAction, FlowActionType, FlowPiecesUpgradedEvent, flowStructureUtil, FlowTrigger, FlowTriggerType, FlowVersion } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { redisConnections } from '../../database/redis-connections'
import { AuditEventEntity } from '../../ee/audit-logs/audit-event-entity'
import { applicationEvents } from '../../helper/application-events'
import { projectService } from '../../project/project-service'
import { flowRepo } from '../flow/flow.repo'
import { FlowVersionEntity } from './flow-version-entity'
import { pieceUpgradeRegister } from './piece-upgrade-register'

export const pieceUpgradeService = (log: FastifyBaseLogger) => ({
    async upgradeFlows({ flowIds, projectId }: UpgradeFlowsParams): Promise<FlowPieceUpgradeResult[]> {
        return Promise.all(unique(flowIds).map((flowId) => upgradeFlow({ flowId, projectId, log })))
    },
    async revertFlows({ flowIds }: RevertFlowsParams): Promise<FlowPieceUpgradeResult[]> {
        return Promise.all(unique(flowIds).map((flowId) => revertFlow({ flowId, log })))
    },
    async migrateFlowVersion({ flowVersion, projectId, platformId }: MigrateFlowVersionParams): Promise<FlowVersionMigrationResult> {
        if (isNil(projectId) || isNil(platformId)) {
            return { migrated: false, flowVersion }
        }
        if (!await isPlatformMigrationEnabled(platformId)) {
            return { migrated: false, flowVersion }
        }
        const { newFlowVersion, decisions } = await resolveFlowVersionUpgrades({ flowVersion, log })
        if (decisions.length > 0) {
            await sendUpgradeAuditEvent({ platformId, projectId, flowId: flowVersion.flowId, flowVersionId: flowVersion.id, decisions, log })
        }
        return { migrated: true, flowVersion: newFlowVersion }
    },
})

const auditEventRepo = repoFactory(AuditEventEntity)
const flowVersionRepo = repoFactory(FlowVersionEntity)
const PIECE_UPGRADE_ENABLED_PLATFORMS_KEY = 'piece_upgrade_enabled_platforms'

async function isPlatformMigrationEnabled(platformId: string): Promise<boolean> {
    const redis = await redisConnections.useExisting()
    const gateExists = await redis.exists(PIECE_UPGRADE_ENABLED_PLATFORMS_KEY)
    if (gateExists === 0) {
        return true
    }
    return await redis.sismember(PIECE_UPGRADE_ENABLED_PLATFORMS_KEY, platformId) === 1
}

async function revertFlow({ flowId, log }: RevertFlowParams): Promise<FlowPieceUpgradeResult> {
    const flow = await flowRepo().findOneBy({ id: flowId })
    if (isNil(flow)) {
        return { flowId, found: false, upgradedSteps: [] }
    }
    const platformId = await projectService(log).getPlatformId(flow.projectId)
    const events = await auditEventRepo().createQueryBuilder('event')
        .where('event.platformId = :platformId', { platformId })
        .andWhere('event.projectId = :projectId', { projectId: flow.projectId })
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
    const updated = await updateTriggerIfUnchanged({ flowVersion, newTrigger: newFlowVersion.trigger })
    if (!updated) {
        log.warn({ flowVersion: { id: flowVersion.id } }, '[pieceUpgradeService] flow version changed concurrently, skipping revert')
        return []
    }

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
    const platformId = await projectService(log).getPlatformId(flow.projectId)
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
        upgradedSteps.push(...await upgradeFlowVersion({ flow, platformId, flowVersion: version, log }))
    }
    return { flowId, found: true, upgradedSteps }
}

async function upgradeFlowVersion({ flow, platformId, flowVersion, log }: UpgradeFlowVersionParams): Promise<UpgradedStep[]> {
    const { newFlowVersion, decisions, upgraded } = await resolveFlowVersionUpgrades({ flowVersion, log })
    if (decisions.length === 0) {
        return []
    }

    if (upgraded.length > 0) {
        const updated = await updateTriggerIfUnchanged({ flowVersion, newTrigger: newFlowVersion.trigger })
        if (!updated) {
            log.warn({ flowVersion: { id: flowVersion.id } }, '[pieceUpgradeService] flow version changed concurrently, skipping upgrade')
            return []
        }
    }

    await sendUpgradeAuditEvent({ platformId, projectId: flow.projectId, flowId: flow.id, flowVersionId: flowVersion.id, decisions, log })

    return upgraded.map((decision) => ({
        flowVersionId: flowVersion.id,
        stepName: decision.stepName,
        pieceName: decision.pieceName,
        fromVersion: decision.prevVersion,
        toVersion: decision.newVersion,
    }))
}

async function resolveFlowVersionUpgrades({ flowVersion, log }: ResolveFlowVersionUpgradesParams): Promise<FlowVersionUpgrades> {
    const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)

    const decisions: StepUpgradeDecision[] = []
    for (const step of steps) {
        const decision = await resolveStepDecision({ step, flowVersion, log })
        if (!isNil(decision)) {
            decisions.push(decision)
        }
    }

    const upgraded = decisions.filter((decision): decision is UpgradedStepDecision => decision.decision === 'UPGRADED')
    if (upgraded.length === 0) {
        return { newFlowVersion: flowVersion, decisions, upgraded }
    }

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
    return { newFlowVersion, decisions, upgraded }
}

async function sendUpgradeAuditEvent({ platformId, projectId, flowId, flowVersionId, decisions, log }: SendUpgradeAuditEventParams): Promise<void> {
    applicationEvents(log).sendUserEvent({ platformId, projectId }, {
        action: ApplicationEventName.FLOW_PIECES_UPGRADED,
        data: {
            flowId,
            flowVersionId,
            steps: decisions.map(toLogStep),
        },
    })
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

async function updateTriggerIfUnchanged({ flowVersion, newTrigger }: UpdateTriggerIfUnchangedParams): Promise<boolean> {
    const updateResult = await flowVersionRepo().createQueryBuilder()
        .update()
        .set({ trigger: newTrigger })
        .where('id = :id', { id: flowVersion.id })
        .andWhere('trigger = CAST(:snapshot AS jsonb)', { snapshot: JSON.stringify(flowVersion.trigger) })
        .execute()
    return updateResult.affected === 1
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

type MigrateFlowVersionParams = {
    flowVersion: FlowVersion
    projectId?: string
    platformId?: string
}

type FlowVersionMigrationResult = {
    migrated: boolean
    flowVersion: FlowVersion
}

type ResolveFlowVersionUpgradesParams = {
    flowVersion: FlowVersion
    log: FastifyBaseLogger
}

type FlowVersionUpgrades = {
    newFlowVersion: FlowVersion
    decisions: StepUpgradeDecision[]
    upgraded: UpgradedStepDecision[]
}

type SendUpgradeAuditEventParams = {
    platformId: string
    projectId: string
    flowId: string
    flowVersionId: string
    decisions: StepUpgradeDecision[]
    log: FastifyBaseLogger
}

type UpdateTriggerIfUnchangedParams = {
    flowVersion: FlowVersion
    newTrigger: FlowVersion['trigger']
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
    platformId: string
    flowVersion: FlowVersion
    log: FastifyBaseLogger
}

type ResolveStepDecisionParams = {
    step: FlowAction | FlowTrigger
    flowVersion: FlowVersion
    log: FastifyBaseLogger
}
