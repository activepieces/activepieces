import { ActivepiecesError, apId, ErrorCode, FlowVersion, isNil, TriggerSource } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { flowTriggerSideEffect } from './flow-trigger-side-effect'
import { TriggerSourceEntity } from './trigger-source-entity'
import { triggerUtils } from './trigger-utils'

export const triggerSourceRepo = repoFactory(TriggerSourceEntity)

export const triggerSourceService = (log: FastifyBaseLogger) => {
    return {
        async enable(params: EnableTriggerParams): Promise<TriggerSource> {
            const { flowVersion, projectId, simulate } = params
            const pieceTrigger = await triggerUtils(log).getPieceTriggerOrThrow({ flowVersion, projectId })

            const { scheduleOptions } = await flowTriggerSideEffect(log).enable({
                flowVersion,
                projectId,
                pieceName: flowVersion.trigger.settings.pieceName,
                pieceTrigger,
                simulate,
            })

            await triggerSourceRepo().softDelete({
                flowId: flowVersion.flowId,
                projectId,
                simulate,
            })

            const triggerSource: Omit<TriggerSource, 'created' | 'updated'> = {
                id: apId(),
                type: pieceTrigger.type,
                projectId,
                flowId: flowVersion.flowId,
                triggerName: pieceTrigger.name,
                flowVersionId: flowVersion.id,
                pieceName: flowVersion.trigger.settings.pieceName,
                pieceVersion: flowVersion.trigger.settings.pieceVersion,
                schedule: scheduleOptions,
                simulate,
            }
            return triggerSourceRepo().save(triggerSource)
        },
        async get(params: GetTriggerParams): Promise<TriggerSource | null> {
            const { projectId, id } = params
            return triggerSourceRepo().findOne({
                where: {
                    id,
                    projectId,
                },
            })
        },
        async getByFlowId(params: GetByFlowIdParams): Promise<TriggerSource | null> {
            const { flowId, simulate } = params
            return triggerSourceRepo().findOne({
                where: {
                    flowId,
                    simulate,
                },
            })
        },
        async getOrThrow({ projectId, id }: GetTriggerParams): Promise<TriggerSource> {
            const triggerSource = await triggerSourceRepo().findOne({
                where: {
                    id,
                    projectId,
                },
            })
            if (isNil(triggerSource)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        entityType: 'trigger',
                        entityId: id,
                    },
                })
            }
            return triggerSource
        },
        async existsByFlowId(params: ExistsByFlowIdParams): Promise<boolean> {
            const { flowId, simulate } = params
            return triggerSourceRepo().existsBy({
                flowId,
                simulate,
            })
        },
        async disable(params: DisableTriggerParams): Promise<void> {
            const { projectId, flowId, simulate } = params
            const triggerSource = await triggerSourceRepo().findOneBy({
                flowId,
                projectId,
                simulate,
            })
            if (isNil(triggerSource)) {
                return
            }
            const flowVersion = await flowVersionService(log).getOneOrThrow(triggerSource.flowVersionId)
            const pieceTrigger = await triggerUtils(log).getPieceTrigger({ flowVersion, projectId })
            if (!isNil(pieceTrigger)) {
                await flowTriggerSideEffect(log).disable({
                    flowVersion,
                    projectId,
                    pieceName: triggerSource.pieceName,
                    pieceTrigger,
                    simulate,
                    ignoreError: params.ignoreError,
                })
            }
            await triggerSourceRepo().softDelete({
                id: triggerSource.id,
                projectId,
            })
        },
    }
}

type ExistsByFlowIdParams = {
    flowId: string
    simulate: boolean
}

type GetByFlowIdParams = {
    flowId: string
    projectId: string
    simulate: boolean
}

type GetTriggerParams = {
    projectId: string
    id: string
}

type DisableTriggerParams = {
    projectId: string
    flowId: string
    simulate: boolean
    ignoreError: boolean
}

type EnableTriggerParams = {
    flowVersion: FlowVersion
    projectId: string
    simulate: boolean
}