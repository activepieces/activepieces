import { isNil } from '@activepieces/core-utils'
import { EngineOperationType, EngineResponseStatus, RenewWebhookJobData, TriggerHookType, WorkerJobType } from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { flowCache } from '../../runtime/local-pool/cache/flow/flow-cache'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../types'
import { resolveFlowArtifacts } from '../utils/flow-helpers'
import { getWebhookUrl } from '../utils/webhook-url'

export const renewWebhookJob: JobHandler<RenewWebhookJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.RENEW_WEBHOOK,
    async execute(ctx: JobContext, data: RenewWebhookJobData): Promise<FireAndForgetJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_HOOKS_TIMEOUT_SECONDS

        const flowVersion = await flowCache(ctx.log, ctx.apiClient).getVersion({ flowVersionId: data.flowVersionId })
        if (isNil(flowVersion)) {
            ctx.log.info({ flowVersion: { id: data.flowVersionId } }, 'Flow version not found for renew webhook, skipping')
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        const artifacts = await resolveFlowArtifacts({ flowVersion, platformId: data.platformId, flowId: data.flowId, projectId: data.projectId, log: ctx.log, apiClient: ctx.apiClient })
        if (artifacts.disabled) {
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        const execution = ctx.runtime.createExecution({ workerIndex: ctx.workerIndex, log: ctx.log, apiClient: ctx.apiClient })
        await execution.init({ flowVersionId: flowVersion.id, platformId: data.platformId, pieces: artifacts.pieces, codeSteps: artifacts.codeSteps })

        try {
            await execution.run({
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
            })

            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }
        catch (e) {
            await execution.dispose({ invalidate: true })
            throw e
        }
        finally {
            await execution.dispose({ invalidate: false })
        }
    },
}
