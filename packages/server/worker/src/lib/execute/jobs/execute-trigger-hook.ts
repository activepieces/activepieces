import {
    EngineOperationType,
    EngineResponseStatus,
    ExecuteTriggerHookJobData,
    tryCatch,
    WorkerJobType,
} from '@activepieces/shared'
import { flowCache } from '../../cache/flow/flow-cache'
import { workerSettings } from '../../config/worker-settings'
import { JobContext, JobHandler, JobResultKind, SynchronousJobResult } from '../types'
import { provisionFlowPieces } from '../utils/flow-helpers'
import { isSandboxTimeout } from '../utils/sandbox-helpers'
import { getWebhookUrl } from '../utils/webhook-url'

export const executeTriggerHookJob: JobHandler<ExecuteTriggerHookJobData, SynchronousJobResult> = {
    jobType: WorkerJobType.EXECUTE_TRIGGER_HOOK,
    async execute(ctx: JobContext, data: ExecuteTriggerHookJobData): Promise<SynchronousJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_HOOKS_TIMEOUT_SECONDS

        const flowVersion = await flowCache(ctx.log, ctx.apiClient).getVersion({ flowVersionId: data.flowVersionId })
        if (!flowVersion) {
            ctx.log.info({ flowVersionId: data.flowVersionId }, 'Flow version not found for trigger hook, skipping')
            return { kind: JobResultKind.SYNCHRONOUS, status: EngineResponseStatus.OK, response: undefined }
        }

        const provisioned = await provisionFlowPieces({ flowVersion, platformId: data.platformId, flowId: data.flowId, projectId: data.projectId, log: ctx.log, apiClient: ctx.apiClient })
        if (!provisioned) {
            ctx.log.info({ flowId: data.flowId }, 'Failed to provision pieces for trigger hook, skipping')
            return { kind: JobResultKind.SYNCHRONOUS, status: EngineResponseStatus.OK, response: undefined }
        }

        const sandbox = ctx.sandboxManager.acquire({ log: ctx.log, apiClient: ctx.apiClient })
        const { data: result, error } = await tryCatch(async () => {
            await sandbox.start({
                flowVersionId: flowVersion.id,
                platformId: data.platformId,
                mounts: [],
            })

            return sandbox.execute(
                EngineOperationType.EXECUTE_TRIGGER_HOOK,
                {
                    hookType: data.hookType,
                    flowVersion,
                    webhookUrl: getWebhookUrl(ctx.publicApiUrl, data.flowId, data.test),
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
        })
        await ctx.sandboxManager.release(ctx.log)

        if (error) {
            await ctx.sandboxManager.invalidate(ctx.log)
            if (isSandboxTimeout(error)) {
                return { kind: JobResultKind.SYNCHRONOUS, status: EngineResponseStatus.TIMEOUT, response: undefined }
            }
            throw error
        }

        return {
            kind: JobResultKind.SYNCHRONOUS,
            status: result.status,
            response: result.response,
            errorMessage: result.error,
            logs: result.logs,
        }
    },
}
