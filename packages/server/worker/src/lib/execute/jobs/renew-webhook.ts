import {
    EngineOperationType,
    isNil,
    RenewWebhookJobData,
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

export const renewWebhookJob: JobHandler<RenewWebhookJobData> = {
    jobType: WorkerJobType.RENEW_WEBHOOK,
    async execute(ctx: JobContext, data: RenewWebhookJobData): Promise<JobResult> {
        const settings = workerSettings.getSettings()
        const timeoutInSeconds = settings.TRIGGER_HOOKS_TIMEOUT_SECONDS

        const flowVersion = await flowCache(ctx.log, ctx.apiClient).getVersion({ flowVersionId: data.flowVersionId })
        if (isNil(flowVersion)) {
            ctx.log.info({ flowVersionId: data.flowVersionId }, 'Flow version not found for renew webhook, skipping')
            return {}
        }

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

            await sandbox.execute(
                EngineOperationType.EXECUTE_TRIGGER_HOOK,
                {
                    hookType: TriggerHookType.RENEW,
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

            return {}
        }
        finally {
            await sandbox.shutdown()
        }
    },
}
