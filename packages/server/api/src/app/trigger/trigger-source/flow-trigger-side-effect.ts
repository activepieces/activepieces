import {
    TriggerBase,
    TriggerStrategy,
    WebhookRenewStrategy,
} from '@activepieces/pieces-framework'
import {
    ActivepiecesError,
    ApEnvironment,
    EngineResponse,
    EngineResponseStatus,
    ErrorCode,
    ExecuteTriggerResponse,
    FlowId,
    FlowTriggerType,
    FlowVersionId,
    isNil,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    ScheduleOptions,
    TriggerHookType,
    TriggerSourceScheduleType,
    tryCatch,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { projectService } from '../../project/project-service'
import { jobQueue, JobType } from '../../workers/job-queue/job-queue'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { appEventRoutingService } from '../app-event-routing/app-event-routing.service'

const environment = system.getOrThrow<ApEnvironment>(AppSystemProp.ENVIRONMENT)

export const flowTriggerSideEffect = (log: FastifyBaseLogger) => {
    return {
        async enable(params: EnableFlowTriggerParams): Promise<ActiveTriggerReturn> {
            if (environment === ApEnvironment.TESTING) {
                return {
                    scheduleOptions: undefined,
                }
            }
            const { flowId, flowVersionId, projectId, simulate, pieceTrigger } = params

            const platformId = await projectService(log).getPlatformId(projectId)
            const engineHelperResponse = await userInteractionWatcher.submitAndWaitForResponse<EngineResponse<ExecuteTriggerResponse<TriggerHookType.ON_ENABLE>>>({
                jobType: WorkerJobType.EXECUTE_TRIGGER_HOOK,
                hookType: TriggerHookType.ON_ENABLE,
                flowId,
                flowVersionId,
                platformId,
                projectId,
                test: simulate,
            }, log)

            assertEngineResponseIsOk(engineHelperResponse, flowId, flowVersionId)

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
                case TriggerStrategy.MANUAL: {
                    return {
                        scheduleOptions: undefined,
                    }
                }
            }
        },
        async disable(params: DisableFlowTriggerParams): Promise<void> {
            if (environment === ApEnvironment.TESTING) {
                return
            }
            const { flowId, flowVersionId, projectId, simulate, pieceTrigger } = params
            const platformId = await projectService(log).getPlatformId(projectId)
            const { error, data: engineHelperResponse } = await tryCatch(
                () => userInteractionWatcher.submitAndWaitForResponse<EngineResponse<ExecuteTriggerResponse<TriggerHookType.ON_DISABLE>>>({
                    jobType: WorkerJobType.EXECUTE_TRIGGER_HOOK,
                    hookType: TriggerHookType.ON_DISABLE,
                    flowId,
                    flowVersionId,
                    test: simulate,
                    projectId,
                    platformId,
                }, log),
            )
            if (!isNil(error)) {
                if (!params.ignoreError) {
                    throw error
                }
                log.warn({ flowId, error: error.message }, '[flowTriggerSideEffect#disable] Ignored error during trigger disable')
            }
            else if (!params.ignoreError) {
                assertEngineResponseIsOk(engineHelperResponse!, flowId, flowVersionId)
            }
            switch (pieceTrigger.type) {
                case TriggerStrategy.APP_WEBHOOK:
                    await appEventRoutingService.deleteListeners({
                        projectId,
                        flowId,
                    })
                    break
                case TriggerStrategy.WEBHOOK: {
                    const renewConfiguration = pieceTrigger.renewConfiguration
                    if (renewConfiguration?.strategy === WebhookRenewStrategy.CRON) {
                        await jobQueue(log).removeRepeatingJob({
                            flowVersionId,
                        })
                    }
                    break
                }
                case TriggerStrategy.POLLING:
                    await jobQueue(log).removeRepeatingJob({
                        flowVersionId,
                    })
                    break
                case TriggerStrategy.MANUAL:
                    break
            }
        },

    }
}

async function handleAppWebhookTrigger({ engineHelperResponse, flowId, projectId, pieceName }: ActiveTriggerParams): Promise<ActiveTriggerReturn> {
    for (const listener of engineHelperResponse.response?.listeners ?? []) {
        await appEventRoutingService.createListeners({
            projectId,
            flowId,
            appName: pieceName,
            events: listener.events,
            identifierValue: listener.identifierValue,
        })
    }
    return {
        scheduleOptions: undefined,
    }
}

async function handleWebhookTrigger({ flowId, flowVersionId, projectId, pieceTrigger, log }: ActiveTriggerParams): Promise<ActiveTriggerReturn> {
    const renewConfiguration = pieceTrigger.renewConfiguration
    switch (renewConfiguration?.strategy) {
        case WebhookRenewStrategy.CRON: {
            const platformId = await projectService(log).getPlatformId(projectId)
            await jobQueue(log).add({
                id: flowVersionId,
                type: JobType.REPEATING,
                data: {
                    schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                    projectId,
                    flowVersionId,
                    flowId,
                    jobType: WorkerJobType.RENEW_WEBHOOK,
                    platformId,
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
    }
}

async function handlePollingTrigger({ engineHelperResponse, flowId, flowVersionId, projectId, log }: ActiveTriggerParams): Promise<ActiveTriggerReturn> {
    const pollingFrequencyCronExpression = `*/${system.getNumber(AppSystemProp.TRIGGER_DEFAULT_POLL_INTERVAL) ?? 5} * * * *`
    const defaultScheduleOptions: ScheduleOptions = {
        cronExpression: pollingFrequencyCronExpression,
        timezone: 'UTC',
        type: TriggerSourceScheduleType.CRON_EXPRESSION,
    }
    const scheduleOptions = engineHelperResponse.response?.scheduleOptions ?? defaultScheduleOptions
    const platformId = await projectService(log).getPlatformId(projectId)
    await jobQueue(log).add({
        id: flowVersionId,
        type: JobType.REPEATING,
        data: {
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            projectId,
            flowVersionId,
            flowId,
            triggerType: FlowTriggerType.PIECE,
            jobType: WorkerJobType.EXECUTE_POLLING,
            platformId,
        },
        scheduleOptions,
    })
    return {
        scheduleOptions,
    }
}

function assertEngineResponseIsOk(engineHelperResponse: EngineResponse<ExecuteTriggerResponse<TriggerHookType.ON_ENABLE | TriggerHookType.ON_DISABLE>>, flowId: FlowId, flowVersionId: FlowVersionId) {
    if (isNil(engineHelperResponse) || engineHelperResponse.status !== EngineResponseStatus.OK) {
        throw new ActivepiecesError({
            code: ErrorCode.TRIGGER_UPDATE_STATUS,
            params: {
                flowId,
                flowVersionId,
                standardOutput: '',
                standardError: engineHelperResponse?.error ?? 'Engine response is undefined',
            },
        }, `flowId=${flowId} standardError=${engineHelperResponse?.error ?? 'Engine response is undefined'}`)
    }
}



type EnableFlowTriggerParams = {
    flowId: FlowId
    flowVersionId: FlowVersionId
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
    engineHelperResponse: EngineResponse<ExecuteTriggerResponse<TriggerHookType.ON_ENABLE>>
}

type ActiveTriggerReturn = {
    scheduleOptions?: ScheduleOptions
}