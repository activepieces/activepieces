import {
    ActivepiecesError,
    ErrorCode,
    FlowActionType,
    flowStructureUtil,
    Step,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
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

        const erroneousLevels = await countErroneousLevels({
            flowId: flowVersion.flowId,
            created: flowVersion.created,
        })
        if (erroneousLevels <= 0) {
            return { flowVersionId, erroneousLevels: 0, stepsChanged: 0 }
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
        log.info({ flowVersionId, erroneousLevels, stepsChanged }, 'Repaired flow version output nesting')

        return { flowVersionId, erroneousLevels, stepsChanged }
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

export type RepairOutputNestingResponse = {
    flowVersionId: string
    erroneousLevels: number
    stepsChanged: number
}
