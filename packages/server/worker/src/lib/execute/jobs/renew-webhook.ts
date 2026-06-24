import { isNil } from '@activepieces/core-utils'
import { EngineOperationType, EngineResponseStatus, FlowVersion, RenewWebhookJobData, TriggerHookType, WorkerJobType } from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../types'
import { getWebhookUrl } from '../utils/webhook-url'

export const renewWebhookJob: JobHandler<RenewWebhookJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.RENEW_WEBHOOK,
    async execute(ctx: JobContext, data: RenewWebhookJobData): Promise<FireAndForgetJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_HOOKS_TIMEOUT_SECONDS

        const resolved = await ctx.resolver.resolve({ platformId: data.platformId, publicApiUrl: ctx.publicApiUrl, engineToken: ctx.engineToken, flow: { id: data.flowId, versionId: data.flowVersionId, projectId: data.projectId } })

        if (resolved.kind === 'flow-not-found') {
            ctx.log.info({ flowVersion: { id: data.flowVersionId } }, 'Flow version not found for renew webhook, skipping')
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        if (resolved.kind === 'disabled') {
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        // resolved.kind === 'ready' — flowVersion is guaranteed present when flow: is passed to resolve
        if (isNil(resolved.flowVersion)) {
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }
        const flowVersion: FlowVersion = resolved.flowVersion

        await ctx.runtime.execute({
            workerIndex: ctx.workerIndex,
            log: ctx.log,
            operationType: EngineOperationType.EXECUTE_TRIGGER_HOOK,
            operation: {
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
            timeoutInSeconds,
            provision: resolved.provision,
        })

        return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
    },
}
