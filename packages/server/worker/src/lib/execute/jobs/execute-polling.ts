import {
    assertNotNullOrUndefined,
    EngineOperationType,
    EngineResponseStatus,
    ExecuteTriggerResponse,
    PollingJobData,
    RunEnvironment,
    StreamStepProgress,
    TriggerHookType,
    WorkerJobType,
} from '@activepieces/shared'
import { flowCache } from '../../cache/flow/flow-cache'
import { workerSettings } from '../../config/worker-settings'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../types'
import { provisionFlowPieces } from '../utils/flow-helpers'
import { getWebhookUrl } from '../utils/webhook-url'

export const executePollingJob: JobHandler<PollingJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EXECUTE_POLLING,
    async execute(ctx: JobContext, data: PollingJobData): Promise<FireAndForgetJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_TIMEOUT_SECONDS

        const flowVersion = await flowCache(ctx.log, ctx.apiClient).getVersion({ flowVersionId: data.flowVersionId })
        assertNotNullOrUndefined(flowVersion, 'flowVersion')

        const provisioned = await provisionFlowPieces({ flowVersion, platformId: data.platformId, flowId: data.flowId, projectId: data.projectId, log: ctx.log, apiClient: ctx.apiClient })
        if (!provisioned) {
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        const sandbox = ctx.sandboxManager.acquire({ log: ctx.log, apiClient: ctx.apiClient })
        try {
            await sandbox.start({
                flowVersionId: flowVersion.id,
                platformId: data.platformId,
                mounts: [],
            })

            const result = await sandbox.execute(
                EngineOperationType.EXECUTE_TRIGGER_HOOK,
                {
                    hookType: TriggerHookType.RUN,
                    flowVersion,
                    webhookUrl: getWebhookUrl(ctx.publicApiUrl, data.flowId),
                    test: false,
                    projectId: data.projectId,
                    platformId: data.platformId,
                    engineToken: ctx.engineToken,
                    internalApiUrl: ctx.internalApiUrl,
                    publicApiUrl: ctx.publicApiUrl,
                    timeoutInSeconds,
                },
                { timeoutInSeconds },
            )

            if (result.status === EngineResponseStatus.OK) {
                const triggerResult = result.response as ExecuteTriggerResponse<TriggerHookType.RUN>
                if (triggerResult.output.length > 0) {
                    await ctx.apiClient.submitPayloads({
                        flowVersionId: data.flowVersionId,
                        projectId: data.projectId,
                        payloads: triggerResult.output,
                        environment: RunEnvironment.PRODUCTION,
                        streamStepProgress: StreamStepProgress.NONE,
                    })
                }
            }

            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK, logs: result.logs }
        }
        catch (e) {
            ctx.log.error({ error: String(e) }, 'Polling trigger failed, will retry on next scheduled cycle')
            await ctx.sandboxManager.invalidate(ctx.log)
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }
        finally {
            await ctx.sandboxManager.release(ctx.log)
        }
    },
}
