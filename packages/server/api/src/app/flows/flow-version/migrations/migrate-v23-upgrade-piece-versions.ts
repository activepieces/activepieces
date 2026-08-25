import { isNil, tryCatch } from '@activepieces/core-utils'
import { FlowAction, FlowActionType, flowStructureUtil, FlowTrigger, FlowTriggerType, FlowVersion } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../../helper/system/system'
import { pieceMetadataService } from '../../../pieces/metadata/piece-metadata-service'
import { Migration } from '.'
import { PieceStepUsage, pieceVersionCompatibility } from './piece-version-compatibility'

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
    const usage = getPieceStepUsage(step)
    if (isNil(usage)) {
        return undefined
    }
    const { pieceName, pieceVersion } = step.settings
    const logContext = {
        flowVersion: { id: flowVersion.id },
        step: { name: step.name },
        piece: { name: pieceName, version: pieceVersion },
    }

    const { data: decision, error } = await tryCatch(() => pieceVersionCompatibility.resolveUpgrade({
        usage,
        currentVersion: pieceVersion,
        getMetadata: async ({ version }) => pieceMetadataService(log).get({
            name: pieceName,
            version,
            platformId: undefined,
            projectId: undefined,
        }),
    }))

    if (!isNil(error)) {
        log.error({ ...logContext, migrationError: error }, '[migrateV23UpgradePieceVersions] failed to resolve upgrade, keeping current version')
        return undefined
    }

    switch (decision.outcome) {
        case 'upgraded':
            log.info({ ...logContext, upgrade: { toVersion: decision.toVersion, candidate: decision.candidate, attempts: decision.attempts } }, '[migrateV23UpgradePieceVersions] piece upgrade pass')
            return decision.toVersion
        case 'kept':
            log.warn({ ...logContext, upgrade: { reason: decision.reason, attempts: decision.attempts } }, '[migrateV23UpgradePieceVersions] piece upgrade fail, keeping current version')
            return undefined
        case 'skipped':
            log.info({ ...logContext, upgrade: { reason: decision.reason } }, '[migrateV23UpgradePieceVersions] piece upgrade skipped')
            return undefined
    }
}

function getPieceStepUsage(step: FlowAction | FlowTrigger): PieceStepUsage | undefined {
    if (step.type === FlowTriggerType.PIECE) {
        const { triggerName, input } = step.settings
        if (isNil(triggerName)) {
            return undefined
        }
        return { kind: 'trigger', stepName: triggerName, inputKeys: getInputKeys(input) }
    }
    if (step.type === FlowActionType.PIECE) {
        const { actionName, input } = step.settings
        if (isNil(actionName)) {
            return undefined
        }
        return { kind: 'action', stepName: actionName, inputKeys: getInputKeys(input) }
    }
    return undefined
}

function getInputKeys(input: Record<string, unknown> | undefined): string[] {
    return Object.keys(input ?? {}).filter((key) => key !== 'auth')
}

type ResolveStepUpgradeParams = {
    step: FlowAction | FlowTrigger
    flowVersion: FlowVersion
    log: FastifyBaseLogger
}
