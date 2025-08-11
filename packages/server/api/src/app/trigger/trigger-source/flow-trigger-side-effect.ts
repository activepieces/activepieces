import {
    TriggerBase,
    TriggerStrategy,
    WebhookRenewStrategy,
} from '@activepieces/pieces-framework'
import {
    AppSystemProp, JobType, LATEST_JOB_DATA_SCHEMA_VERSION,
    RepeatableJobType,
    UserInteractionJobType,
} from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEnvironment,
    EngineResponseStatus,
    ErrorCode,
    FlowTriggerType,
    FlowVersion,
    isNil,
    RunEnvironment,
    ScheduleOptions,
    TriggerHookType,
    TriggerSourceScheduleType,
    WebhookHandshakeConfiguration,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import {
    EngineHelperResponse,
    EngineHelperTriggerResult,
} from 'server-worker'
import { appEventRoutingService } from '../../app-event-routing/app-event-routing.service'
import { system } from '../../helper/system/system'
import { jobQueue } from '../../workers/queue'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'

const environment = system.getOrThrow<ApEnvironment>(AppSystemProp.ENVIRONMENT)

export const flowTriggerSideEffect = (log: FastifyBaseLogger) => {
    return {
        async enable(params: EnableFlowTriggerParams): Promise<ActiveTriggerReturn> {
            if (environment === ApEnvironment.TESTING) {
                return {
                    scheduleOptions: undefined,
                    webhookHandshakeConfiguration: undefined,
                }
            }
            const { flowVersion, projectId, simulate, pieceTrigger } = params

            const engineHelperResponse = await userInteractionWatcher(log).submitAndWaitForResponse<EngineHelperResponse<EngineHelperTriggerResult<TriggerHookType.ON_ENABLE>>>({
                jobType: UserInteractionJobType.EXECUTE_TRIGGER_HOOK,
                hookType: TriggerHookType.ON_ENABLE,
                flowVersion,
                projectId,
                test: simulate,
            })

            assertEngineResponseIsOk(engineHelperResponse, flowVersion)

            switch (pieceTrigger.type) {
                case TriggerStrategy.APP_WEBHOOK: {
                    return handleAppWebhookTrigger({
                        engineHelperResponse,
                        log,
                        ...params,
                    })
                }
                case TriggerStrategy.WEBHOOK: {
                    return handleWebhookTrigger({
                        engineHelperResponse,
                        log,
                        ...params,
                    })
                }
                case TriggerStrategy.POLLING: {
                    return handlePollingTrigger({
                        engineHelperResponse,
                        log,
                        ...params,
                    })
                }
            }
        },
        async disable(params: DisableFlowTriggerParams): Promise<void> {
            const { flowVersion, projectId, simulate, pieceTrigger } = params
            const engineHelperResponse = await userInteractionWatcher(log).submitAndWaitForResponse<EngineHelperResponse<EngineHelperTriggerResult<TriggerHookType.ON_DISABLE>>>({
                jobType: UserInteractionJobType.EXECUTE_TRIGGER_HOOK,
                hookType: TriggerHookType.ON_DISABLE,
                flowVersion,
                test: simulate,
                projectId,
            })
            if (!params.ignoreError) {
                assertEngineResponseIsOk(engineHelperResponse, flowVersion)
            }
            switch (pieceTrigger.type) {
                case TriggerStrategy.APP_WEBHOOK:
                    await appEventRoutingService.deleteListeners({
                        projectId,
                        flowId: flowVersion.flowId,
                    })
                    break
                case TriggerStrategy.WEBHOOK: {
                    const renewConfiguration = pieceTrigger.renewConfiguration
                    if (renewConfiguration?.strategy === WebhookRenewStrategy.CRON) {
                        await jobQueue(log).removeRepeatingJob({
                            flowVersionId: flowVersion.id,
                        })
                    }
                    break
                }
                case TriggerStrategy.POLLING:
                    await jobQueue(log).removeRepeatingJob({
                        flowVersionId: flowVersion.id,
                    })
                    break
            }
        },

    }
}

async function handleAppWebhookTrigger({ engineHelperResponse, flowVersion, projectId, pieceName }: ActiveTriggerParams): Promise<ActiveTriggerReturn> {
    for (const listener of engineHelperResponse.result.listeners) {
        await appEventRoutingService.createListeners({
            projectId,
            flowId: flowVersion.flowId,
            appName: pieceName,
            events: listener.events,
            identifierValue: listener.identifierValue,
        })
    }
    return {
        scheduleOptions: undefined,
        webhookHandshakeConfiguration: undefined,
    }
}

async function handleWebhookTrigger({ flowVersion, projectId, pieceTrigger, log }: ActiveTriggerParams): Promise<ActiveTriggerReturn> {
    const renewConfiguration = pieceTrigger.renewConfiguration
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
                    type: TriggerSourceScheduleType.CRON_EXPRESSION,
                    cronExpression: renewConfiguration.cronExpression,
                    timezone: 'UTC',
                },
            })
            break
        }
        default:
            break
    }
    return {
        scheduleOptions: undefined,
        webhookHandshakeConfiguration: undefined,
    }
}

async function handlePollingTrigger({ engineHelperResponse, flowVersion, projectId, log }: ActiveTriggerParams): Promise<ActiveTriggerReturn> {
    const pollingFrequencyCronExpression = `*/${system.getNumber(AppSystemProp.TRIGGER_DEFAULT_POLL_INTERVAL) ?? 5} * * * *`

    if (isNil(engineHelperResponse.result.scheduleOptions)) {
        engineHelperResponse.result.scheduleOptions = {
            cronExpression: pollingFrequencyCronExpression,
            timezone: 'UTC',
            type: TriggerSourceScheduleType.CRON_EXPRESSION,
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
            triggerType: FlowTriggerType.PIECE,
            jobType: RepeatableJobType.EXECUTE_TRIGGER,
        },
        scheduleOptions: engineHelperResponse.result.scheduleOptions,
    })
    return {
        scheduleOptions: engineHelperResponse.result.scheduleOptions,
        webhookHandshakeConfiguration: undefined,
    }
}

function assertEngineResponseIsOk(engineHelperResponse: EngineHelperResponse<EngineHelperTriggerResult<TriggerHookType.ON_ENABLE | TriggerHookType.ON_DISABLE>>, flowVersion: FlowVersion) {
    if (engineHelperResponse.status !== EngineResponseStatus.OK) {
        throw new ActivepiecesError({
            code: ErrorCode.TRIGGER_ENABLE,
            params: {
                flowVersionId: flowVersion.id,
                standardOutput: engineHelperResponse.standardOutput,
                standardError: engineHelperResponse.standardError,
            },
        })
    }
}



type EnableFlowTriggerParams = {
    flowVersion: FlowVersion
    pieceName: string
    projectId: string
    pieceTrigger: TriggerBase
    simulate: boolean
}

type DisableFlowTriggerParams = EnableFlowTriggerParams & {
    ignoreError: boolean
}

type ActiveTriggerParams = EnableFlowTriggerParams & {
    log: FastifyBaseLogger
    engineHelperResponse: EngineHelperResponse<EngineHelperTriggerResult<TriggerHookType.ON_ENABLE>>
}

type ActiveTriggerReturn = {
    scheduleOptions?: ScheduleOptions
    webhookHandshakeConfiguration?: WebhookHandshakeConfiguration
}