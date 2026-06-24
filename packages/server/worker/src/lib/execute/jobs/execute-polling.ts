import { isNil } from '@activepieces/core-utils'
import { EngineOperationType, EngineResponseStatus, ExecuteTriggerResponse, FlowVersion, PollingJobData, RunEnvironment, StreamStepProgress, TriggerHookType, WorkerJobType } from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../types'
import { getWebhookUrl } from '../utils/webhook-url'

export const executePollingJob: JobHandler<PollingJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EXECUTE_POLLING,
    async execute(ctx: JobContext, data: PollingJobData): Promise<FireAndForgetJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_TIMEOUT_SECONDS

        const execution = ctx.runtime.createExecution({ workerIndex: ctx.workerIndex, log: ctx.log, apiClient: ctx.apiClient })
        const p = await execution.provision({ platformId: data.platformId, flow: { id: data.flowId, versionId: data.flowVersionId, projectId: data.projectId } })

        if (p.kind === 'flow-not-found') {
            ctx.log.info({ flowVersion: { id: data.flowVersionId } }, 'Flow version not found for polling trigger, skipping')
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        if (p.kind === 'disabled') {
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        // p.kind === 'ready' — flowVersion is guaranteed present when flow: is passed to provision
        if (isNil(p.flowVersion)) {
            await execution.dispose({ invalidate: true })
            throw new Error('flowVersion missing after provision')
        }
        const flowVersion: FlowVersion = p.flowVersion

        try {
            const result = await execution.run({
                operationType: EngineOperationType.EXECUTE_TRIGGER_HOOK,
                operation: {
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
                timeoutInSeconds,
            })

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
            await execution.dispose({ invalidate: true })
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }
        finally {
            await execution.dispose({ invalidate: false })
        }
    },
}
