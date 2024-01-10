import {
    TriggerBase,
    TriggerStrategy,
    WebhookHandshakeStrategy,
    WebhookResponse,
} from '@activepieces/pieces-framework'
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
    ApEdition,
} from '@activepieces/shared'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { flowQueue } from '../workers/flow-worker/flow-queue'
import {
    EngineHelperResponse,
    EngineHelperTriggerResult,
    engineHelper,
} from './engine-helper'
import { webhookService } from '../webhooks/webhook-service'
import { appEventRoutingService } from '../app-event-routing/app-event-routing.service'
import { isNil } from '@activepieces/shared'
import { LATEST_JOB_DATA_SCHEMA_VERSION } from '../workers/flow-worker/job-data'
import { pieceMetadataService } from '../pieces/piece-metadata-service'
import { logger } from './logger'
import { system } from './system/system'
import { SystemProp } from './system/system-prop'
import { JobType } from '../workers/flow-worker/queues/queue'
import { getEdition } from './secret-helper'
import { plansService } from '../ee/billing/project-plan/project-plan.service'

function constructEveryXMinuteCron(minute: number) {
    const edition = getEdition()
    switch (edition) {
        case ApEdition.CLOUD:
            return `*/${minute} * * * *`
        case ApEdition.COMMUNITY:
        case ApEdition.ENTERPRISE:
            return `*/${system.getNumber(
                SystemProp.TRIGGER_DEFAULT_POLL_INTERVAL,
            ) ?? 5} * * * *`
    }
}

const POLLING_FREQUENCY_CRON_EXPRESSON = constructEveryXMinuteCron(system.getNumber(SystemProp.TRIGGER_DEFAULT_POLL_INTERVAL) ?? 5)

export const triggerUtils = {
    async tryHandshake(params: ExecuteTrigger): Promise<WebhookResponse | null> {
        const { payload, flowVersion, projectId } = params
        const flowTrigger = flowVersion.trigger
        if (flowTrigger.type === TriggerType.PIECE) {
            const pieceTrigger = await getPieceTrigger({
                trigger: flowTrigger,
                projectId,
            })
            const handshakeConfig = pieceTrigger.handshakeConfiguration
            if (isNil(handshakeConfig)) {
                return null
            }
            const strategy = handshakeConfig.strategy ?? WebhookHandshakeStrategy.NONE
            switch (strategy) {
                case WebhookHandshakeStrategy.HEADER_PRESENT: {
                    if (
                        handshakeConfig.paramName &&
            handshakeConfig.paramName.toLowerCase() in payload.headers
                    ) {
                        return executeHandshake({
                            flowVersion,
                            projectId,
                            payload,
                        })
                    }
                    break
                }
                case WebhookHandshakeStrategy.QUERY_PRESENT: {
                    if (
                        handshakeConfig.paramName &&
            handshakeConfig.paramName in payload.queryParams
                    ) {
                        return executeHandshake({
                            flowVersion,
                            projectId,
                            payload,
                        })
                    }
                    break
                }
                case WebhookHandshakeStrategy.BODY_PARAM_PRESENT: {
                    if (
                        handshakeConfig.paramName &&
            typeof payload.body === 'object' &&
            payload.body !== null &&
            handshakeConfig.paramName in payload.body
                    ) {
                        return executeHandshake({
                            flowVersion,
                            projectId,
                            payload,
                        })
                    }
                    break
                }
                default:
                    break
            }
        }
        return null
    },
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
                    flowVersion,
                    triggerPayload: payload,
                    webhookUrl: await webhookService.getWebhookUrl({
                        flowId: flowVersion.flowId,
                        simulate,
                    }),
                    projectId,
                })

                if (result.success && Array.isArray(result.output)) {
                    payloads = result.output
                }
                else {
                    logger.error(
                        `Flow ${flowTrigger.name} with ${pieceTrigger.name} trigger throws and error, returning as zero payload ` +
              JSON.stringify(result),
                    )
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
    ): Promise<EngineHelperResponse<
        EngineHelperTriggerResult<TriggerHookType.ON_ENABLE>
        > | null> {
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
    ): Promise<EngineHelperResponse<
        EngineHelperTriggerResult<TriggerHookType.ON_DISABLE>
        > | null> {
        const { flowVersion, projectId, simulate } = params

        if (flowVersion.trigger.type !== TriggerType.PIECE) {
            return null
        }

        return disablePieceTrigger({
            projectId,
            flowVersion,
            simulate,
        })
    },
}

async function executeHandshake(
    params: ExecuteHandshakeParams,
): Promise<WebhookResponse> {
    const { flowVersion, projectId, payload } = params
    const { result } = await engineHelper.executeTrigger({
        hookType: TriggerHookType.HANDSHAKE,
        flowVersion,
        triggerPayload: payload,
        webhookUrl: await webhookService.getWebhookUrl({
            flowId: flowVersion.flowId,
            simulate: false,
        }),
        projectId,
    })
    if (!result.success || result.response === undefined) {
        return {
            status: 500,
            body: {
                error: 'Failed to execute handshake',
            },
        }
    }
    return result.response
}

type ExecuteHandshakeParams = {
    flowVersion: FlowVersion
    projectId: ProjectId
    payload: TriggerPayload
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
        flowVersion,
        webhookUrl: await webhookService.getWebhookUrl({
            flowId: flowVersion.flowId,
            simulate,
        }),
        projectId,
    })

    switch (pieceTrigger.type) {
        case TriggerStrategy.APP_WEBHOOK:
            await appEventRoutingService.deleteListeners({
                projectId,
                flowId: flowVersion.flowId,
            })
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
        flowVersion,
        webhookUrl,
        projectId,
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
            if (isNil(engineHelperResponse.result.scheduleOptions)) {
                engineHelperResponse.result.scheduleOptions = {
                    cronExpression: POLLING_FREQUENCY_CRON_EXPRESSON,
                    timezone: 'UTC',
                }
                // BEGIN EE
                const edition = getEdition()
                if (edition === ApEdition.CLOUD) {
                    const plan = await plansService.getOrCreateDefaultPlan({
                        projectId,
                    })
                    engineHelperResponse.result.scheduleOptions.cronExpression = constructEveryXMinuteCron(plan.minimumPollingInterval)
                }
                // END EE
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
                scheduleOptions: engineHelperResponse.result.scheduleOptions,
            })
            break
        }
    }

    return engineHelperResponse
}

async function getPieceTrigger({
    trigger,
    projectId,
}: {
    trigger: PieceTrigger
    projectId: ProjectId
}): Promise<TriggerBase> {
    const piece = await pieceMetadataService.getOrThrow({
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
