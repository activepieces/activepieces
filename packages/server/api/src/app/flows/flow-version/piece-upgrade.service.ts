import { isNil, spreadIfDefined, unique } from '@activepieces/core-utils'
import { FlowAction, FlowActionType, flowStructureUtil, FlowTrigger, FlowTriggerType, FlowVersion } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRepo } from '../flow/flow.repo'
import { flowVersionRepo } from './flow-version.service'
import { pieceUpgradeRegister } from './piece-upgrade-register'

export const pieceUpgradeService = (log: FastifyBaseLogger) => ({
    async upgradeFlows({ flowIds, projectId }: UpgradeFlowsParams): Promise<FlowPieceUpgradeResult[]> {
        return Promise.all(unique(flowIds).map((flowId) => upgradeFlow({ flowId, projectId, log })))
    },
})

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
        upgradedSteps.push(...await upgradeFlowVersion({ flowVersion: version, log }))
    }
    return { flowId, found: true, upgradedSteps }
}

async function upgradeFlowVersion({ flowVersion, log }: UpgradeFlowVersionParams): Promise<UpgradedStep[]> {
    const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)

    const upgradedSteps: UpgradedStep[] = []
    for (const step of steps) {
        const upgradedVersion = await resolveStepUpgrade({ step, flowVersion, log })
        if (!isNil(upgradedVersion)) {
            upgradedSteps.push({
                flowVersionId: flowVersion.id,
                stepName: step.name,
                pieceName: step.settings.pieceName,
                fromVersion: step.settings.pieceVersion,
                toVersion: upgradedVersion,
            })
        }
    }
    if (upgradedSteps.length === 0) {
        return []
    }

    const stepNameToNewVersion = Object.fromEntries(upgradedSteps.map((upgrade) => [upgrade.stepName, upgrade.toVersion]))
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
    return upgradedSteps
}

async function resolveStepUpgrade({ step, flowVersion, log }: ResolveStepUpgradeParams): Promise<string | undefined> {
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

    const decision = pieceUpgradeRegister.resolveDecision({ entry, usedStepName })
    switch (decision.outcome) {
        case 'upgraded':
            log.info({ ...logContext, upgrade: { toVersion: decision.toVersion } }, '[pieceUpgradeService] piece upgrade pass')
            return decision.toVersion
        case 'kept':
            log.warn({ ...logContext, upgrade: { target: entry.target, flaggedStep: usedStepName } }, '[pieceUpgradeService] step flagged unsafe in upgrade register, keeping current version')
            return undefined
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

type UpgradeFlowsParams = {
    flowIds: string[]
    projectId?: string
}

type UpgradeFlowParams = {
    flowId: string
    projectId?: string
    log: FastifyBaseLogger
}

type UpgradeFlowVersionParams = {
    flowVersion: FlowVersion
    log: FastifyBaseLogger
}

type ResolveStepUpgradeParams = {
    step: FlowAction | FlowTrigger
    flowVersion: FlowVersion
    log: FastifyBaseLogger
}
