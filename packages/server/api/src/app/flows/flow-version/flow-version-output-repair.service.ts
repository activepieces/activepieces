import {
    ActivepiecesError,
    ErrorCode,
    FlowActionType,
    flowStructureUtil,
    Metadata,
    Step,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRepo } from '../flow/flow.repo'
import { flowVersionRepo } from './flow-version.service'
import { expressionRewriter } from './migrations/expression-rewriter'

export const flowVersionOutputRepairService = (log: FastifyBaseLogger) => ({
    async repairOutputNesting(flowVersionId: string): Promise<RepairOutputNestingResponse> {
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

        if (getRepairedVersionIds(flow.metadata).includes(flowVersionId)) {
            log.info({ flowVersionId }, 'Flow version output nesting already repaired, skipping')
            return { flowVersionId, erroneousLevels: 0, stepsChanged: 0, alreadyRepaired: true }
        }

        const erroneousLevels = await countErroneousLevels({
            flowId: flowVersion.flowId,
            created: flowVersion.created,
        })
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

        await flowVersionRepo().update(flowVersion.id, { trigger: repaired.trigger })
        flow.metadata = addRepairedVersionId(flow.metadata, flowVersionId)
        await flowRepo().save(flow)
        log.info({ flowVersionId, erroneousLevels, stepsChanged }, 'Repaired flow version output nesting')

        return { flowVersionId, erroneousLevels, stepsChanged, alreadyRepaired: false }
    },
})

async function countErroneousLevels({ flowId, created }: { flowId: string, created: string }): Promise<number> {
    const lineageCount = await flowVersionRepo()
        .createQueryBuilder('flow_version')
        .where('flow_version."flowId" = :flowId', { flowId })
        .andWhere('flow_version."created" <= :created', { created })
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
        [OUTPUT_NESTING_REPAIRED_VERSIONS_KEY]: [...getRepairedVersionIds(metadata), flowVersionId],
    }
}

const OUTPUT_NESTING_REPAIRED_VERSIONS_KEY = 'outputNestingRepairedVersionIds'

export type RepairOutputNestingResponse = {
    flowVersionId: string
    erroneousLevels: number
    stepsChanged: number
    alreadyRepaired: boolean
}
