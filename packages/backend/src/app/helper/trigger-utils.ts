import { TriggerBase, TriggerStrategy } from '@activepieces/pieces-framework'
import {
    ExecutionType,
    EngineResponseStatus,
    FlowVersion,
    PieceTrigger,
    ProjectId,
    RunEnvironment,
    TriggerHookType,
    TriggerPayload,
    TriggerType,
} from '@activepieces/shared'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { JobType, flowQueue } from '../workers/flow-worker/flow-queue'
import { EngineHelperResponse, EngineHelperTriggerResult, engineHelper } from './engine-helper'
import { webhookService } from '../webhooks/webhook-service'
import { appEventRoutingService } from '../app-event-routing/app-event-routing.service'
import { isNil } from '@activepieces/shared'
import { LATEST_JOB_DATA_SCHEMA_VERSION } from '../workers/flow-worker/job-data'
import { pieceMetadataService } from '../pieces/piece-metadata-service'
import { captureException, logger } from './logger'

export const triggerUtils = {
    async executeTrigger(params: ExecuteTrigger): Promise<unknown[]> {
        const { payload, flowVersion, projectId, simulate } = params
        const flowTrigger = flowVersion.trigger
        let payloads: unknown[] = []
        switch (flowTrigger.type) {
            case TriggerType.PIECE: {
                const pieceTrigger = await getPieceTrigger({
                    trigger: flowTrigger,
                    projectId,
                })
                const { result } = await engineHelper.executeTrigger({
                    hookType: TriggerHookType.RUN,
                    flowVersion: flowVersion,
                    triggerPayload: payload,
                    webhookUrl: await webhookService.getWebhookUrl({
                        flowId: flowVersion.flowId,
                        simulate,
                    }),
                    projectId: projectId,
                })


                if (result.success && Array.isArray(result.output)) {
                    payloads = result.output
                }
                else {
                    logger.error(`Flow ${flowTrigger.name} with ${pieceTrigger.name} trigger throws and error, returning as zero payload ` + JSON.stringify(result))
                    payloads = []
                }

                break
            }
            default:
                payloads = [payload]
                break
        }
        return payloads as unknown[]
    },

    async enable(
        params: EnableOrDisableParams,
    ): Promise<EngineHelperResponse<EngineHelperTriggerResult<TriggerHookType.ON_ENABLE>> | null> {
        const { flowVersion, projectId, simulate } = params

        if (flowVersion.trigger.type !== TriggerType.PIECE) {
            return null
        }

        return enablePieceTrigger({
            projectId,
            flowVersion,
            simulate,
        })
    },

    async disable(
        params: EnableOrDisableParams,
    ): Promise<EngineHelperResponse<EngineHelperTriggerResult<TriggerHookType.ON_DISABLE>> | null> {
        const { flowVersion, projectId, simulate } = params

        if (flowVersion.trigger.type !== TriggerType.PIECE) {
            return null
        }

        return await disablePieceTrigger({
            projectId,
            flowVersion,
            simulate,
        })
    },
}

const disablePieceTrigger = async (params: EnableOrDisableParams) => {
    const { flowVersion, projectId, simulate } = params
    const flowTrigger = flowVersion.trigger as PieceTrigger
    const pieceTrigger = await getPieceTrigger({
        trigger: flowTrigger,
        projectId,
    })

    const engineHelperResponse = await engineHelper.executeTrigger({
        hookType: TriggerHookType.ON_DISABLE,
        flowVersion: flowVersion,
        webhookUrl: await webhookService.getWebhookUrl({
            flowId: flowVersion.flowId,
            simulate,
        }),
        projectId: projectId,
    })

    switch (pieceTrigger.type) {
        case TriggerStrategy.APP_WEBHOOK:
            await appEventRoutingService.deleteListeners({ projectId, flowId: flowVersion.flowId })
            break
        case TriggerStrategy.WEBHOOK:
            break
        case TriggerStrategy.POLLING:
            await flowQueue.removeRepeatingJob({
                id: flowVersion.id,
            })
            break
    }

    return engineHelperResponse
}

const enablePieceTrigger = async (params: EnableOrDisableParams) => {
    const { flowVersion, projectId, simulate } = params
    const flowTrigger = flowVersion.trigger as PieceTrigger
    const pieceTrigger = await getPieceTrigger({
        trigger: flowTrigger,
        projectId,
    })

    const webhookUrl = await webhookService.getWebhookUrl({
        flowId: flowVersion.flowId,
        simulate,
    })

    const engineHelperResponse = await engineHelper.executeTrigger({
        hookType: TriggerHookType.ON_ENABLE,
        flowVersion: flowVersion,
        webhookUrl,
        projectId: projectId,
    })

    if (engineHelperResponse.status !== EngineResponseStatus.OK) {
        return engineHelperResponse
    }

    switch (pieceTrigger.type) {
        case TriggerStrategy.APP_WEBHOOK: {
            const appName = flowTrigger.settings.pieceName
            for (const listener of engineHelperResponse.result.listeners) {
                await appEventRoutingService.createListeners({
                    projectId,
                    flowId: flowVersion.flowId,
                    appName,
                    events: listener.events,
                    identifierValue: listener.identifierValue,
                })
            }
            break
        }
        case TriggerStrategy.WEBHOOK:
            break
        case TriggerStrategy.POLLING: {
            const scheduleOptions = engineHelperResponse.result.scheduleOptions
            if(isNil(scheduleOptions)){
                captureException(new Error('ScheduleOptions can\'t be null in engine response when trigger is polling'))
                return null
            }
            await flowQueue.add({
                id: flowVersion.id,
                type: JobType.REPEATING,
                data: {
                    schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                    projectId,
                    environment: RunEnvironment.PRODUCTION,
                    flowVersionId: flowVersion.id,
                    flowId: flowVersion.flowId,
                    triggerType: TriggerType.PIECE,
                    executionType: ExecutionType.BEGIN,
                },
                scheduleOptions: scheduleOptions,
            })
            break

        }
    }

    return engineHelperResponse
}

async function getPieceTrigger({ trigger, projectId }: { trigger: PieceTrigger, projectId: ProjectId }): Promise<TriggerBase> {
    const piece = await pieceMetadataService.get({
        projectId,
        name: trigger.settings.pieceName,
        version: trigger.settings.pieceVersion,
    })

    if (isNil(piece)) {
        throw new ActivepiecesError({
            code: ErrorCode.PIECE_NOT_FOUND,
            params: {
                pieceName: trigger.settings.pieceName,
                pieceVersion: trigger.settings.pieceVersion,
            },
        })
    }
    const pieceTrigger = piece.triggers[trigger.settings.triggerName]
    if (isNil(pieceTrigger)) {
        throw new ActivepiecesError({
            code: ErrorCode.PIECE_TRIGGER_NOT_FOUND,
            params: {
                pieceName: trigger.settings.pieceName,
                pieceVersion: trigger.settings.pieceVersion,
                triggerName: trigger.settings.triggerName,
            },
        })
    }
    return pieceTrigger
}

type BaseParams = {
    projectId: ProjectId
    flowVersion: FlowVersion
    simulate: boolean
}

type EnableOrDisableParams = BaseParams

type ExecuteTrigger = BaseParams & {
    payload: TriggerPayload
}
