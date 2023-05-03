import { TriggerBase, TriggerStrategy } from '@activepieces/pieces-framework'
import {
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
import { engineHelper } from './engine-helper'
import { webhookService } from '../webhooks/webhook-service'
import { appEventRoutingService } from '../app-event-routing/app-event-routing.service'
import { captureException } from '@sentry/node'
import {  isNil } from 'lodash'
import { pieceMetadataLoader } from '../pieces/piece-metadata-loader'

export const triggerUtils = {
    async executeTrigger(params: ExecuteTrigger): Promise<unknown[]> {
        const { payload, flowVersion, projectId, simulate } = params
        const flowTrigger = flowVersion.trigger
        let payloads: unknown[] = []
        switch (flowTrigger.type) {
            case TriggerType.PIECE: {
                const pieceTrigger = await getPieceTrigger(flowTrigger)
                const result = await engineHelper.executeTrigger({
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
                    const error = new ActivepiecesError({
                        code: ErrorCode.TRIGGER_FAILED,
                        params: {
                            triggerName: pieceTrigger.name,
                            pieceName: flowTrigger.settings.pieceName,
                            pieceVersion: flowTrigger.settings.pieceVersion,
                            error: result.message,
                        },
                    }, `Flow ${flowTrigger.name} with ${pieceTrigger.name} trigger throws and error, returning as zero payload `)
                    captureException(error)
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

    async enable({ flowVersion, projectId, simulate }: EnableOrDisableParams): Promise<void> {
        switch (flowVersion.trigger.type) {
            case TriggerType.PIECE:
                await enablePieceTrigger({
                    projectId,
                    flowVersion,
                    simulate,
                })
                break
            default:
                break
        }
    },

    async disable({ flowVersion, projectId, simulate }: EnableOrDisableParams): Promise<void> {
        switch (flowVersion.trigger.type) {
            case TriggerType.PIECE:
                await disablePieceTrigger({
                    projectId,
                    flowVersion,
                    simulate,
                })
                break
            default:
                break
        }
    },
}

const disablePieceTrigger = async (params: EnableOrDisableParams): Promise<void> => {
    const { flowVersion, projectId, simulate } = params
    const flowTrigger = flowVersion.trigger as PieceTrigger
    const pieceTrigger = await getPieceTrigger(flowTrigger)

    await engineHelper.executeTrigger({
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
            await flowQueue.removeRepeatableJob({
                id: flowVersion.id,
            })
            break
    }
}

const enablePieceTrigger = async (params: EnableOrDisableParams): Promise<void> => {
    const { flowVersion, projectId, simulate } = params
    const flowTrigger = flowVersion.trigger as PieceTrigger
    const pieceTrigger = await getPieceTrigger(flowTrigger)

    const webhookUrl = await webhookService.getWebhookUrl({
        flowId: flowVersion.flowId,
        simulate,
    })

    const response = await engineHelper.executeTrigger({
        hookType: TriggerHookType.ON_ENABLE,
        flowVersion: flowVersion,
        webhookUrl,
        projectId: projectId,
    })

    switch (pieceTrigger.type) {
        case TriggerStrategy.APP_WEBHOOK: {
            const appName = flowTrigger.settings.pieceName
            const listeners = response.listeners
            for (const listener of listeners) {
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
            const scheduleOptions = response.scheduleOptions
            await flowQueue.add({
                id: flowVersion.id,
                type: JobType.REPEATABLE,
                data: {
                    projectId,
                    environment: RunEnvironment.PRODUCTION,
                    flowVersion,
                    triggerType: TriggerType.PIECE,
                },
                scheduleOptions: scheduleOptions,
            })
            break

        }
    }
}

export async function getPieceTrigger(trigger: PieceTrigger): Promise<TriggerBase> {
    const piece = await pieceMetadataLoader.pieceMetadata(trigger.settings.pieceName, trigger.settings.pieceVersion)
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
