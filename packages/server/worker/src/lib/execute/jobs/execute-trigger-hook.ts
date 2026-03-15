import {
    EngineOperationType,
    ExecuteTriggerHookJobData,
    WorkerJobType,
} from '@activepieces/shared'
import { flowCache } from '../../cache/flow/flow-cache'
import { provisioner } from '../../cache/provisioner'
import { workerSettings } from '../../config/worker-settings'
import { sandboxManager } from '../sandbox-manager'
import { JobContext, JobHandler, JobResult } from '../types'
import { extractCodeArtifacts, extractPiecePackages } from '../utils/flow-helpers'
import { getWebhookUrl } from '../utils/webhook-url'

export const executeTriggerHookJob: JobHandler<ExecuteTriggerHookJobData> = {
    jobType: WorkerJobType.EXECUTE_TRIGGER_HOOK,
    async execute(ctx: JobContext, data: ExecuteTriggerHookJobData): Promise<JobResult> {
        const settings = workerSettings.getSettings()
        const timeoutInSeconds = settings.TRIGGER_HOOKS_TIMEOUT_SECONDS

        const flowVersion = await flowCache(ctx.log, ctx.apiClient).getVersion({ flowVersionId: data.flowVersionId })
        if (!flowVersion) {
            ctx.log.info({ flowVersionId: data.flowVersionId }, 'Flow version not found for trigger hook, skipping')
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

            const result = await sandbox.execute(
                EngineOperationType.EXECUTE_TRIGGER_HOOK,
                {
                    hookType: data.hookType,
                    flowVersion,
                    webhookUrl: getWebhookUrl(settings.PUBLIC_URL, data.flowId, data.test),
                    triggerPayload: data.triggerPayload,
                    test: data.test,
                    projectId: data.projectId,
                    platformId: data.platformId,
                    engineToken: ctx.engineToken,
                    internalApiUrl: ctx.internalApiUrl,
                    publicApiUrl: ctx.publicApiUrl,
                    timeoutInSeconds,
                },
                { timeoutInSeconds },
            )

            return {
                response: {
                    status: result.engine.status,
                    response: result.engine.response,
                },
            }
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
