import { isNil } from '@activepieces/core-utils'
import { EngineOperationType, EngineResponseStatus, ExecuteTriggerResponse, FlowVersion, PollingJobData, RunEnvironment, StreamStepProgress, TriggerHookType, WorkerJobType } from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../types'
import { recordTriggerRun } from '../utils/trigger-run-recorder'
import { getWebhookUrl } from '../utils/webhook-url'

export const executePollingJob: JobHandler<PollingJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EXECUTE_POLLING,
    async execute(ctx: JobContext, data: PollingJobData): Promise<FireAndForgetJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_TIMEOUT_SECONDS

        const resolved = await ctx.resolver.resolve({ platformId: data.platformId, publicApiUrl: ctx.publicApiUrl, engineToken: ctx.engineToken, flow: { id: data.flowId, versionId: data.flowVersionId, projectId: data.projectId } })

        if (resolved.kind === 'flow-not-found') {
            ctx.log.info({ flowVersion: { id: data.flowVersionId } }, 'Flow version not found for polling trigger, skipping')
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        if (resolved.kind === 'disabled') {
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        // resolved.kind === 'ready' — flowVersion is guaranteed present when flow: is passed to resolve
        if (isNil(resolved.flowVersion)) {
            throw new Error('flowVersion missing after resolve')
        }
        const flowVersion: FlowVersion = resolved.flowVersion

        try {
            const result = await ctx.runtime.execute({
                workerIndex: ctx.workerIndex,
                log: ctx.log,
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
                provision: resolved.provision,
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

            await recordTriggerRun({ apiClient: ctx.apiClient, log: ctx.log, flowVersion, platformId: data.platformId, status: result.status })

            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK, logs: result.logs }
        }
        catch (e) {
            ctx.log.error({ error: String(e) }, 'Polling trigger failed, will retry on next scheduled cycle')
            await recordTriggerRun({ apiClient: ctx.apiClient, log: ctx.log, flowVersion, platformId: data.platformId, status: EngineResponseStatus.INTERNAL_ERROR })
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }
    },
}
