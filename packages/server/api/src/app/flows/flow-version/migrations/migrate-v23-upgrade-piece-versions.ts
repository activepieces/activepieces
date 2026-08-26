import { isNil } from '@activepieces/core-utils'
import { FlowAction, FlowActionType, flowStructureUtil, FlowTrigger, FlowTriggerType, FlowVersion } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../../helper/system/system'
import { pieceUpgradeRegister } from './piece-upgrade-register'
import { Migration } from '.'

export const migrateV23UpgradePieceVersions: Migration = {
    targetSchemaVersion: '23',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const log = system.globalLogger()
        const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)

        const stepNameToNewVersion: Record<string, string> = {}
        for (const step of steps) {
            const upgradedVersion = await resolveStepUpgrade({ step, flowVersion, log })
            if (!isNil(upgradedVersion)) {
                stepNameToNewVersion[step.name] = upgradedVersion
            }
        }

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

        return {
            ...newFlowVersion,
            schemaVersion: '24',
        }
    },
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
        log.info(logContext, '[migrateV23UpgradePieceVersions] piece version not in upgrade register, keeping current version')
        return undefined
    }

    const decision = pieceUpgradeRegister.resolveDecision({ entry, usedStepName })
    switch (decision.outcome) {
        case 'upgraded':
            log.info({ ...logContext, upgrade: { toVersion: decision.toVersion } }, '[migrateV23UpgradePieceVersions] piece upgrade pass')
            return decision.toVersion
        case 'kept':
            log.warn({ ...logContext, upgrade: { target: entry.target, flaggedStep: usedStepName } }, '[migrateV23UpgradePieceVersions] step flagged unsafe in upgrade register, keeping current version')
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

type ResolveStepUpgradeParams = {
    step: FlowAction | FlowTrigger
    flowVersion: FlowVersion
    log: FastifyBaseLogger
}
