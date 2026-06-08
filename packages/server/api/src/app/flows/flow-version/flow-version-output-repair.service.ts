import {
    ActivepiecesError,
    ErrorCode,
    FlowActionType,
    flowStructureUtil,
    Metadata,
    Step,
    unique,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { transaction } from '../../core/db/transaction'
import { flowRepo } from '../flow/flow.repo'
import { flowVersionRepo } from './flow-version.service'
import { expressionRewriter } from './migrations/expression-rewriter'

export const flowVersionOutputRepairService = (log: FastifyBaseLogger) => ({
    async repairOutputNesting({ flowVersionId, forceSingleOutput = false }: RepairOutputNestingParams): Promise<RepairOutputNestingResponse> {
        const flowVersion = await flowVersionRepo().findOneBy({ id: flowVersionId })
        if (flowVersion === null) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'flow_version', entityId: flowVersionId },
            })
        }

        const flow = await flowRepo().findOneBy({ id: flowVersion.flowId })
        if (flow === null) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'flow', entityId: flowVersion.flowId },
            })
        }

        // forceSingleOutput collapses every `['output']` chain down to exactly one,
        // regardless of how many erroneous migrations the lineage suggests. It is
        // idempotent (re-collapsing a single output is a no-op), so it intentionally
        // bypasses the already-repaired guard to recover flows the heuristic missed.
        if (!forceSingleOutput && getRepairedVersionIds(flow.metadata).includes(flowVersionId)) {
            log.info({ flowVersionId }, 'Flow version output nesting already repaired, skipping')
            return { flowVersionId, erroneousLevels: 0, stepsChanged: 0, alreadyRepaired: true }
        }

        const erroneousLevels = forceSingleOutput
            ? COLLAPSE_TO_SINGLE_OUTPUT_LEVELS
            : await countErroneousLevels({ flowId: flowVersion.flowId, flowVersionId })
        if (erroneousLevels <= 0) {
            return { flowVersionId, erroneousLevels: 0, stepsChanged: 0, alreadyRepaired: false }
        }

        const stepNames = flowStructureUtil.getAllSteps(flowVersion.trigger).map((step) => step.name)
        let stepsChanged = 0
        const repaired = flowStructureUtil.transferFlow(flowVersion, (step: Step) => {
            const strippedSettings = expressionRewriter.stripOutputDeep(step.settings, stepNames, erroneousLevels)
            const newStep = { ...step, settings: strippedSettings }
            if (newStep.type === FlowActionType.CODE) {
                newStep.settings.sourceCode = step.settings.sourceCode
            }
            if (JSON.stringify(step.settings) !== JSON.stringify(newStep.settings)) {
                stepsChanged++
            }
            return newStep
        })

        const didRepair = await transaction(async (entityManager) => {
            const lockedFlow = await flowRepo(entityManager)
                .createQueryBuilder('flow')
                .setLock('pessimistic_write')
                .where('flow.id = :id', { id: flowVersion.flowId })
                .getOne()
            if (lockedFlow === null) {
                return false
            }
            if (!forceSingleOutput && getRepairedVersionIds(lockedFlow.metadata).includes(flowVersionId)) {
                return false
            }
            await flowVersionRepo(entityManager).update(flowVersion.id, { trigger: repaired.trigger })
            lockedFlow.metadata = addRepairedVersionId(lockedFlow.metadata, flowVersionId)
            await flowRepo(entityManager).save(lockedFlow)
            return true
        })

        if (!didRepair) {
            log.info({ flowVersionId }, 'Flow version output nesting already repaired, skipping')
            return { flowVersionId, erroneousLevels: 0, stepsChanged: 0, alreadyRepaired: true }
        }
        log.info({ flowVersionId, forceSingleOutput, stepsChanged }, 'Repaired flow version output nesting')

        return { flowVersionId, erroneousLevels, stepsChanged, alreadyRepaired: false }
    },
})

async function countErroneousLevels({ flowId, flowVersionId }: { flowId: string, flowVersionId: string }): Promise<number> {
    // Compare against the stored `created` value via a subquery rather than passing
    // `flowVersion.created` from JS: the JS value is truncated to millisecond precision,
    // while Postgres stores microseconds, so a `<=` filter would exclude the version itself.
    const lineageCount = await flowVersionRepo()
        .createQueryBuilder('flow_version')
        .where('flow_version."flowId" = :flowId', { flowId })
        .andWhere('flow_version."created" <= (SELECT lineage."created" FROM flow_version lineage WHERE lineage.id = :flowVersionId)', { flowVersionId })
        .andWhere('jsonb_exists(flow_version."backupFiles", \'21\')')
        .getCount()
    return Math.max(0, lineageCount - 1)
}

function getRepairedVersionIds(metadata: Metadata | undefined | null): string[] {
    const repaired = metadata?.[OUTPUT_NESTING_REPAIRED_VERSIONS_KEY]
    if (!Array.isArray(repaired)) {
        return []
    }
    return repaired.filter((id): id is string => typeof id === 'string')
}

function addRepairedVersionId(metadata: Metadata | undefined | null, flowVersionId: string): Metadata {
    return {
        ...(metadata ?? {}),
        [OUTPUT_NESTING_REPAIRED_VERSIONS_KEY]: unique([...getRepairedVersionIds(metadata), flowVersionId]),
    }
}

const OUTPUT_NESTING_REPAIRED_VERSIONS_KEY = 'outputNestingRepairedVersionIds'

// Larger than any real `['output']` chain; stripOutputDeep caps per-reference at
// (chain depth - 1), so this collapses every chain to exactly one output.
const COLLAPSE_TO_SINGLE_OUTPUT_LEVELS = 1000

export type RepairOutputNestingParams = {
    flowVersionId: string
    forceSingleOutput?: boolean
}

export type RepairOutputNestingResponse = {
    flowVersionId: string
    erroneousLevels: number
    stepsChanged: number
    alreadyRepaired: boolean
}
