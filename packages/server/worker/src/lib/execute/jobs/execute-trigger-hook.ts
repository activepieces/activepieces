import { isNil, tryCatch } from '@activepieces/core-utils'
import { EngineOperationType, EngineResponseStatus, ExecuteTriggerHookJobData, WorkerJobType } from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { flowCache } from '../../runtime/local-pool/cache/flow/flow-cache'
import { JobContext, JobHandler, JobResultKind, SynchronousJobResult } from '../types'
import { resolveFlowArtifacts } from '../utils/flow-helpers'
import { isSandboxTimeout } from '../utils/sandbox-helpers'
import { getWebhookUrl } from '../utils/webhook-url'

export const executeTriggerHookJob: JobHandler<ExecuteTriggerHookJobData, SynchronousJobResult> = {
    jobType: WorkerJobType.EXECUTE_TRIGGER_HOOK,
    async execute(ctx: JobContext, data: ExecuteTriggerHookJobData): Promise<SynchronousJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_HOOKS_TIMEOUT_SECONDS

        const flowVersion = await flowCache(ctx.log, ctx.apiClient).getVersion({ flowVersionId: data.flowVersionId })
        if (!flowVersion) {
            ctx.log.info({ flowVersion: { id: data.flowVersionId } }, 'Flow version not found for trigger hook, skipping')
            return { kind: JobResultKind.SYNCHRONOUS, status: EngineResponseStatus.OK, response: undefined }
        }

        const artifacts = await resolveFlowArtifacts({ flowVersion, platformId: data.platformId, flowId: data.flowId, projectId: data.projectId, log: ctx.log, apiClient: ctx.apiClient })
        if (artifacts.disabled) {
            ctx.log.info({ flow: { id: data.flowId } }, 'Failed to provision pieces for trigger hook, skipping')
            return { kind: JobResultKind.SYNCHRONOUS, status: EngineResponseStatus.OK, response: undefined }
        }

        const execution = ctx.runtime.createExecution({ workerIndex: ctx.workerIndex, log: ctx.log, apiClient: ctx.apiClient })
        await execution.init({ flowVersionId: flowVersion.id, platformId: data.platformId, pieces: artifacts.pieces, codeSteps: artifacts.codeSteps })

        const { data: result, error } = await tryCatch(async () => {
            return execution.run({
                operationType: EngineOperationType.EXECUTE_TRIGGER_HOOK,
                operation: {
                    hookType: data.hookType,
                    flowVersion,
                    webhookUrl: getWebhookUrl(ctx.publicApiUrl, data.flowId, data.test),
                    triggerPayload: isNil(data.triggerPayload) ? undefined : { type: 'inline', value: data.triggerPayload },
                    test: data.test,
                    projectId: data.projectId,
                    platformId: data.platformId,
                    engineToken: ctx.engineToken,
                    internalApiUrl: ctx.internalApiUrl,
                    publicApiUrl: ctx.publicApiUrl,
                    timeoutInSeconds,
                },
                timeoutInSeconds,
            })
        })
        await execution.dispose({ invalidate: false })

        if (error) {
            await execution.dispose({ invalidate: true })
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
