import { appEventRoutingService } from '../../../app-event-routing/app-event-routing.service'
import { projectLimitsService } from '../../../ee/project-plan/project-plan.service'
import { flowQueue } from '../../../flow-worker/queue'
import {
    generateEngineToken,
} from '../../../helper/engine-helper'
import { triggerUtils } from './trigger-utils'
import { DEFAULT_FREE_PLAN_LIMIT } from '@activepieces/ee-shared'
import {
    TriggerStrategy,
    WebhookRenewStrategy,
} from '@activepieces/pieces-framework'
import {
    JobType, LATEST_JOB_DATA_SCHEMA_VERSION, RepeatableJobType,
    system,
    SystemProp,
} from '@activepieces/server-shared'
import {
    ApEdition,
    EngineResponseStatus,
    FlowVersion,
    isNil,
    PieceTrigger,
    ProjectId,
    RunEnvironment,
    TriggerHookType,
    TriggerType,
} from '@activepieces/shared'
import {
    EngineHelperResponse,
    EngineHelperTriggerResult,
    engineRunner,
    webhookUtils,
} from 'server-worker'

const POLLING_FREQUENCY_CRON_EXPRESSON = constructEveryXMinuteCron(
    system.getNumber(SystemProp.TRIGGER_DEFAULT_POLL_INTERVAL) ?? 5,
)

function constructEveryXMinuteCron(minute: number): string {
    const edition = system.getEdition()
    switch (edition) {
        case ApEdition.CLOUD:
            return `*/${minute} * * * *`
        case ApEdition.COMMUNITY:
        case ApEdition.ENTERPRISE:
            return `*/${system.getNumber(SystemProp.TRIGGER_DEFAULT_POLL_INTERVAL) ?? 5
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
    const pieceTrigger = await triggerUtils.getPieceTriggerOrThrow({
        trigger: flowTrigger,
        projectId,
    })

    const webhookUrl = await webhookUtils.getWebhookUrl({
        flowId: flowVersion.flowId,
        simulate,
    })

    const engineToken = await generateEngineToken({
        projectId,
    })

    const engineHelperResponse = await engineRunner.executeTrigger(engineToken, {
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
                const edition = system.getEdition()
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
