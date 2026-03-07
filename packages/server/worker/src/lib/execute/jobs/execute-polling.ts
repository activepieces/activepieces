import {
    assertNotNullOrUndefined,
    EngineOperationType,
    EngineResponseStatus,
    ExecuteTriggerResponse,
    isNil,
    PollingJobData,
    ProgressUpdateType,
    RunEnvironment,
    TriggerHookType,
    WorkerJobType,
} from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { provisioner } from '../../cache/provisioner'
import { flowCache } from '../../cache/flow/flow-cache'
import { createSandboxForJob } from '../create-sandbox-for-job'
import { extractCodeArtifacts, extractPiecePackages } from '../utils/flow-helpers'
import { getWebhookUrl } from '../utils/webhook-url'
import { JobHandler, JobContext, JobResult } from '../types'

export const executePollingJob: JobHandler<PollingJobData> = {
    jobType: WorkerJobType.EXECUTE_POLLING,
    async execute(ctx: JobContext, data: PollingJobData): Promise<JobResult> {
        const settings = workerSettings.getSettings()
        const timeoutInSeconds = settings.TRIGGER_TIMEOUT_SECONDS

        const flowVersion = await flowCache(ctx.log, ctx.apiClient).getVersion({ flowVersionId: data.flowVersionId })
        assertNotNullOrUndefined(flowVersion, 'flowVersion')

        const pieces = await extractPiecePackages(flowVersion, data.platformId, ctx.log, ctx.apiClient)
        const codeSteps = extractCodeArtifacts(flowVersion)
        await provisioner(ctx.log, ctx.apiClient).provision({ pieces, codeSteps })

        const sandbox = createSandboxForJob({ log: ctx.log, apiClient: ctx.apiClient })
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
                    webhookUrl: getWebhookUrl(settings.PUBLIC_URL, data.flowId),
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
                        flowVersionId: data.flowVersionId,
                        projectId: data.projectId,
                        payloads: triggerResult.output,
                        environment: RunEnvironment.PRODUCTION,
                        progressUpdateType: ProgressUpdateType.NONE,
                    })
                }
            }

            return {}
        }
        finally {
            await sandbox.shutdown()
        }
    },
}
