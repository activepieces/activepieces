import {
    EngineOperationType,
    EngineResponseStatus,
    isNil,
    RenewWebhookJobData,
    TriggerHookType,
    tryCatch,
    WorkerJobType,
} from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { flowCache } from '../cache/flow/flow-cache'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../types'
import { getWebhookUrl } from '../utils/webhook-url'

export const renewWebhookJob: JobHandler<RenewWebhookJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.RENEW_WEBHOOK,
    async execute(ctx: JobContext, data: RenewWebhookJobData): Promise<FireAndForgetJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_HOOKS_TIMEOUT_SECONDS

        const flowVersion = await flowCache(ctx.log, ctx.apiClient).getVersion({ flowVersionId: data.flowVersionId })
        if (isNil(flowVersion)) {
            ctx.log.info({ flowVersionId: data.flowVersionId }, 'Flow version not found for renew webhook, skipping')
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        const { data: sandbox, error: readyError } = await tryCatch(() => ctx.sandboxManager.ready({
            operation: { kind: 'FLOW', flowVersion, platformId: data.platformId, flowId: data.flowId, projectId: data.projectId },
            log: ctx.log,
            apiClient: ctx.apiClient,
        }))
        if (readyError) {
            ctx.log.error({ flowId: data.flowId, error: String(readyError) }, 'Failed to provision flow for renew webhook')
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.INTERNAL_ERROR }
        }

        try {
            await sandbox.execute(
                EngineOperationType.EXECUTE_TRIGGER_HOOK,
                {
                    hookType: TriggerHookType.RENEW,
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

            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }
        catch (e) {
            await ctx.sandboxManager.invalidate(ctx.log)
            throw e
        }
        finally {
            await ctx.sandboxManager.release(ctx.log)
        }
    },
}
