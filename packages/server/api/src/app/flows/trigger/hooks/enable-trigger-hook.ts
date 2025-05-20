import {
    TriggerStrategy,
    WebhookRenewStrategy,
} from '@activepieces/pieces-framework'
import {
    AppSystemProp, JobType, LATEST_JOB_DATA_SCHEMA_VERSION,
    RepeatableJobType,
    UserInteractionJobType } from '@activepieces/server-shared'
import {
    EngineResponseStatus,
    FlowVersion,
    isNil,
    PieceTrigger,
    ProjectId,
    RunEnvironment,
    TriggerHookType,
    TriggerType,
    WebhookHandshakeConfiguration,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import {
    EngineHelperResponse,
    EngineHelperTriggerResult,
} from 'server-worker'
import { appEventRoutingService } from '../../../app-event-routing/app-event-routing.service'
import { system } from '../../../helper/system/system'
import { jobQueue } from '../../../workers/queue'
import { userInteractionWatcher } from '../../../workers/user-interaction-watcher'
import { triggerUtils } from './trigger-utils'


const POLLING_FREQUENCY_CRON_EXPRESSION = `*/${system.getNumber(AppSystemProp.TRIGGER_DEFAULT_POLL_INTERVAL) ?? 5} * * * *`


type EnableTriggerResponse = EngineHelperResponse<
EngineHelperTriggerResult<TriggerHookType.ON_ENABLE>
> & {
    webhookHandshakeConfiguration: WebhookHandshakeConfiguration | null
}
export const enablePieceTrigger = async (
    params: EnableParams,
    log: FastifyBaseLogger,
): Promise<EnableTriggerResponse | null> => {
    const { flowVersion, projectId, simulate } = params
    if (flowVersion.trigger.type !== TriggerType.PIECE) {
        return null
    }
    const flowTrigger = flowVersion.trigger as PieceTrigger
    const pieceTrigger = await triggerUtils(log).getPieceTriggerOrThrow({
        trigger: flowTrigger,
        projectId,
    })

    const engineHelperResponse = await userInteractionWatcher(log).submitAndWaitForResponse<EngineHelperResponse<EngineHelperTriggerResult<TriggerHookType.ON_ENABLE>>>({
        jobType: UserInteractionJobType.EXECUTE_TRIGGER_HOOK,
        hookType: TriggerHookType.ON_ENABLE,
        flowVersion,
        projectId,
        test: simulate,
    })
    let webhookHandshakeConfiguration: WebhookHandshakeConfiguration | null = null

    if (engineHelperResponse.status !== EngineResponseStatus.OK) {
        return {
            ...engineHelperResponse,
            webhookHandshakeConfiguration: null,
        }
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
        case TriggerStrategy.WEBHOOK: {
            const renewConfiguration = pieceTrigger.renewConfiguration
            webhookHandshakeConfiguration = pieceTrigger.handshakeConfiguration ?? null
            switch (renewConfiguration?.strategy) {
                case WebhookRenewStrategy.CRON: {
                    await jobQueue(log).add({
                        id: flowVersion.id,
                        type: JobType.REPEATING,
                        data: {
                            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                            projectId,
                            flowVersionId: flowVersion.id,
                            flowId: flowVersion.flowId,
                            jobType: RepeatableJobType.RENEW_WEBHOOK,
                        },
                        scheduleOptions: {
                            cronExpression: renewConfiguration.cronExpression,
                            timezone: 'UTC',
                            failureCount: 0,
                        },
                    })
                    break
                }
                default:
                    break
            }
            break
        }
        case TriggerStrategy.POLLING: {
            if (isNil(engineHelperResponse.result.scheduleOptions)) {
                engineHelperResponse.result.scheduleOptions = {
                    cronExpression: POLLING_FREQUENCY_CRON_EXPRESSION,
                    timezone: 'UTC',
                    failureCount: 0,
                }
            }
            await jobQueue(log).add({
                id: flowVersion.id,
                type: JobType.REPEATING,
                data: {
                    schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                    projectId,
                    environment: RunEnvironment.PRODUCTION,
                    flowVersionId: flowVersion.id,
                    flowId: flowVersion.flowId,
                    triggerType: TriggerType.PIECE,
                    jobType: RepeatableJobType.EXECUTE_TRIGGER,
                },
                scheduleOptions: engineHelperResponse.result.scheduleOptions,
            })
            break
        }
    }

    return {
        ...engineHelperResponse,
        webhookHandshakeConfiguration,
    }
}

type EnableParams = {
    projectId: ProjectId
    flowVersion: FlowVersion
    simulate: boolean
}
