import {
    ApEdition,
    EngineResponseStatus,
    FlowVersion,
    PieceTrigger,
    ProjectId,
    RunEnvironment,
    TriggerHookType,
    TriggerType,
    isNil,
} from '@activepieces/shared'
import { SystemProp, system } from 'server-shared'
import { getEdition } from '../../../helper/secret-helper'
import {
    LATEST_JOB_DATA_SCHEMA_VERSION,
    RepeatableJobType,
} from '../../../workers/flow-worker/job-data'
import { JobType } from '../../../workers/flow-worker/queues/queue'
import { flowQueue } from '../../../workers/flow-worker/flow-queue'
import {
    TriggerStrategy,
    WebhookRenewStrategy,
} from '@activepieces/pieces-framework'
import { appEventRoutingService } from '../../../app-event-routing/app-event-routing.service'
import {
    EngineHelperResponse,
    EngineHelperTriggerResult,
    engineHelper,
} from '../../../helper/engine-helper'
import { webhookService } from '../../../webhooks/webhook-service'
import { getPieceTrigger } from './trigger-utils'
import { projectLimitsService } from '../../../ee/project-plan/project-plan.service'
import { DEFAULT_FREE_PLAN_LIMIT } from '@activepieces/ee-shared'

const POLLING_FREQUENCY_CRON_EXPRESSON = constructEveryXMinuteCron(
    system.getNumber(SystemProp.TRIGGER_DEFAULT_POLL_INTERVAL) ?? 5,
)

function constructEveryXMinuteCron(minute: number): string {
    const edition = getEdition()
    switch (edition) {
        case ApEdition.CLOUD:
            return `*/${minute} * * * *`
        case ApEdition.COMMUNITY:
        case ApEdition.ENTERPRISE:
            return `*/${
                system.getNumber(SystemProp.TRIGGER_DEFAULT_POLL_INTERVAL) ?? 5
            } * * * *`
    }
}

export const enablePieceTrigger = async (
    params: EnableParams,
): Promise<EngineHelperResponse<
EngineHelperTriggerResult<TriggerHookType.ON_ENABLE>
> | null> => {
    const { flowVersion, projectId, simulate } = params
    if (flowVersion.trigger.type !== TriggerType.PIECE) {
        return null
    }
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
        case TriggerStrategy.WEBHOOK: {
            const renewConfiguration = pieceTrigger.renewConfiguration
            switch (renewConfiguration?.strategy) {
                case WebhookRenewStrategy.CRON: {
                    await flowQueue.add({
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
                    cronExpression: POLLING_FREQUENCY_CRON_EXPRESSON,
                    timezone: 'UTC',
                }
                // BEGIN EE
                const edition = getEdition()
                if (edition === ApEdition.CLOUD) {
                    const plan = await projectLimitsService.getOrCreateDefaultPlan(projectId, DEFAULT_FREE_PLAN_LIMIT)
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
                    jobType: RepeatableJobType.EXECUTE_TRIGGER,
                },
                scheduleOptions: engineHelperResponse.result.scheduleOptions,
            })
            break
        }
    }

    return engineHelperResponse
}

type EnableParams = {
    projectId: ProjectId
    flowVersion: FlowVersion
    simulate: boolean
}
