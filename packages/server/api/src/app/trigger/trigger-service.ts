import { ActivepiecesError, apId, ErrorCode, FlowVersion, isNil, Trigger } from "@activepieces/shared"
import { TriggerEntity } from "./trigger-entity"
import { repoFactory } from "../core/db/repo-factory"
import { FastifyBaseLogger } from "fastify"
import { triggerUtils } from "./trigger-utils"
import { flowTriggerSideEffect } from "./flow-trigger-side-effect"
import { flowVersionService } from "../flows/flow-version/flow-version.service"

export const triggerRepo = repoFactory(TriggerEntity)

export const triggerService = (log: FastifyBaseLogger) => {
    return {
        async enable(params: EnableTriggerParams): Promise<Trigger> {
            const { flowVersion, projectId, simulate } = params
            const pieceTrigger = await triggerUtils(log).getPieceTriggerOrThrow({ flowVersion, projectId })

            const { scheduleOptions, webhookHandshakeConfiguration } = await flowTriggerSideEffect(log).enable({
                flowVersion,
                projectId,
                pieceName: flowVersion.trigger.settings.pieceName,
                pieceTrigger,
                simulate,
            })
            const trigger: Omit<Trigger, 'created' | 'updated'> = {
                id: apId(),
                type: pieceTrigger.type,
                projectId,
                flowId: flowVersion.flowId,
                flowVersionId: flowVersion.id,
                pieceName: flowVersion.trigger.settings.pieceName,
                pieceVersion: flowVersion.trigger.settings.pieceVersion,
                handshakeConfiguration: webhookHandshakeConfiguration,
                schedule: scheduleOptions,
                simulate,
            }
            return await triggerRepo().save(trigger)
        },
        async get(params: GetTriggerParams): Promise<Trigger | null> {
            const { projectId, id } = params
            return await triggerRepo().findOne({
                where: {
                    id,
                    projectId,
                },
            })
        },
        async getOrThrow({ projectId, id }: GetTriggerParams): Promise<Trigger> {
            const trigger = await triggerRepo().findOne({
                where: {
                    id,
                    projectId,
                },
            })
            if (isNil(trigger)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        entityType: 'trigger',
                        entityId: id,
                    },
                })
            }
            return trigger
        },
        async existsByFlowId(params: ExistsByFlowIdParams): Promise<boolean> {
            const { flowId, simulate } = params
            return await triggerRepo().existsBy({
                flowId,
                simulate,
            })
        },
        async disable(params: DisableTriggerParams): Promise<void> {
            const { projectId, flowId, simulate } = params
            const trigger = await triggerRepo().findOneBy({
                flowId,
                projectId,
                simulate,
            })
            if (isNil(trigger)) {
                return
            }
            const flowVersion = await flowVersionService(log).getOneOrThrow(trigger.flowVersionId)
            const pieceTrigger = await triggerUtils(log).getPieceTrigger({ flowVersion, projectId })
            if (!isNil(pieceTrigger)) {
                await flowTriggerSideEffect(log).disable({
                    flowVersion,
                    projectId,
                    pieceName: trigger.pieceName,
                    pieceTrigger,
                    simulate,
                    ignoreError: params.ignoreError,
                })
            }
            await triggerRepo().delete({
                id: trigger.id,
                projectId,
            })
        }
    }
}

type ExistsByFlowIdParams = {
    flowId: string,
    simulate: boolean,
}

type GetTriggerParams = {
    projectId: string,
    id: string,
    simulate: boolean,
}

type DisableTriggerParams = {
    projectId: string,
    flowId: string,
    simulate: boolean,
    ignoreError: boolean,
}

type EnableTriggerParams = {
    flowVersion: FlowVersion,
    projectId: string,
    simulate: boolean
}