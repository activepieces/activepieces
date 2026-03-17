import {
    EngineOperationType,
    EngineResponseStatus,
    ExecuteTriggerResponse,
    isNil,
    ProgressUpdateType,
    TriggerHookType,
    TriggerPayload,
    WebhookJobData,
    WorkerJobType,
} from '@activepieces/shared'
import { flowCache } from '../../cache/flow/flow-cache'
import { provisioner } from '../../cache/provisioner'
import { workerSettings } from '../../config/worker-settings'
import { sandboxManager } from '../sandbox-manager'
import { JobContext, JobHandler, JobResult } from '../types'
import { extractCodeArtifacts, extractPiecePackages } from '../utils/flow-helpers'
import { resolvePayload } from '../utils/resolve-payload'
import { getWebhookUrl } from '../utils/webhook-url'

export const executeWebhookJob: JobHandler<WebhookJobData> = {
    jobType: WorkerJobType.EXECUTE_WEBHOOK,
    async execute(ctx: JobContext, data: WebhookJobData): Promise<JobResult> {
        const settings = workerSettings.getSettings()
        const timeoutInSeconds = settings.TRIGGER_TIMEOUT_SECONDS
        const resolvedPayload = await resolvePayload(data.payload, data.projectId, ctx.apiClient)

        const flowVersion = await flowCache(ctx.log, ctx.apiClient).getVersion({ flowVersionId: data.flowVersionIdToRun })
        if (isNil(flowVersion)) {
            ctx.log.info({ flowVersionId: data.flowVersionIdToRun }, 'Flow version not found for webhook, skipping')
            return {}
        }

        const pieces = await extractPiecePackages(flowVersion, data.platformId, ctx.log, ctx.apiClient)
        const codeSteps = extractCodeArtifacts(flowVersion)
        await provisioner(ctx.log, ctx.apiClient).provision({ pieces, codeSteps })

        const sandbox = sandboxManager.acquire({ log: ctx.log, apiClient: ctx.apiClient })
        try {
            await sandbox.start({
                flowVersionId: flowVersion.id,
                platformId: data.platformId,
                mounts: [],
            })

            if (data.saveSampleData) {
                const sampleResult = await sandbox.execute(
                    EngineOperationType.EXECUTE_TRIGGER_HOOK,
                    {
                        hookType: TriggerHookType.RUN,
                        flowVersion,
                        webhookUrl: getWebhookUrl(settings.PUBLIC_URL, data.flowId, true),
                        triggerPayload: resolvedPayload as TriggerPayload,
                        test: true,
                        projectId: data.projectId,
                        platformId: data.platformId,
                        engineToken: ctx.engineToken,
                        internalApiUrl: ctx.internalApiUrl,
                        publicApiUrl: ctx.publicApiUrl,
                        timeoutInSeconds,
                    },
                    { timeoutInSeconds },
                )

                if (sampleResult.engine.status === EngineResponseStatus.OK) {
                    const sampleTriggerResult = sampleResult.engine.response as ExecuteTriggerResponse<TriggerHookType.RUN>
                    if (sampleTriggerResult.success && sampleTriggerResult.output.length > 0) {
                        await ctx.apiClient.savePayloads({
                            flowId: data.flowId,
                            flowVersionId: flowVersion.id,
                            projectId: data.projectId,
                            payloads: sampleTriggerResult.output,
                        })
                    }
                }
            }

            if (!data.execute) {
                return {}
            }

            const result = await sandbox.execute(
                EngineOperationType.EXECUTE_TRIGGER_HOOK,
                {
                    hookType: TriggerHookType.RUN,
                    flowVersion,
                    webhookUrl: getWebhookUrl(settings.PUBLIC_URL, data.flowId),
                    triggerPayload: resolvedPayload as TriggerPayload,
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

            if (result.engine.status === EngineResponseStatus.OK) {
                const triggerResult = result.engine.response as ExecuteTriggerResponse<TriggerHookType.RUN>
                if (triggerResult.success && triggerResult.output.length > 0) {
                    await ctx.apiClient.submitPayloads({
                        flowVersionId: flowVersion.id,
                        projectId: data.projectId,
                        payloads: triggerResult.output,
                        httpRequestId: data.requestId,
                        environment: data.runEnvironment,
                        progressUpdateType: ProgressUpdateType.NONE,
                        parentRunId: data.parentRunId,
                        failParentOnFailure: data.failParentOnFailure,
                    })
                }
            }

            return {}
        }
        catch (e) {
            await sandboxManager.invalidate(ctx.log)
            throw e
        }
        finally {
            await sandboxManager.release(ctx.log)
        }
    },
}
