import {
    EngineOperationType,
    EngineResponseStatus,
    ExecuteTriggerResponse,
    FlowVersion,
    isNil,
    parseToJsonIfPossible,
    PieceTrigger,
    ProgressUpdateType,
    TriggerHookType,
    TriggerPayload,
    WebhookJobData,
    WorkerJobType,
} from '@activepieces/shared'
import { flowCache } from '../../cache/flow/flow-cache'
import { workerSettings } from '../../config/worker-settings'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../types'
import { provisionFlowPieces } from '../utils/flow-helpers'
import { resolvePayload } from '../utils/resolve-payload'
import { getAppWebhookUrl, getWebhookUrl } from '../utils/webhook-url'

function getAppWebhookDetails(flowVersion: FlowVersion, publicApiUrl: string, appWebhookSecretsJson: string): { appWebhookUrl?: string, webhookSecret?: string | Record<string, string> } {
    const trigger = flowVersion.trigger as PieceTrigger
    const pieceName = trigger?.settings?.pieceName
    if (isNil(pieceName)) {
        return {}
    }
    const secrets = parseToJsonIfPossible(appWebhookSecretsJson) as Record<string, { webhookSecret: string | Record<string, string> }> | undefined
    const webhookSecret = secrets?.[pieceName]?.webhookSecret
    const pieceUrlName = pieceName.replace('@activepieces/piece-', '')
    return {
        appWebhookUrl: getAppWebhookUrl(publicApiUrl, pieceUrlName),
        webhookSecret,
    }
}

export const executeWebhookJob: JobHandler<WebhookJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EXECUTE_WEBHOOK,
    async execute(ctx: JobContext, data: WebhookJobData): Promise<FireAndForgetJobResult> {
        const settings = workerSettings.getSettings()
        const timeoutInSeconds = settings.TRIGGER_TIMEOUT_SECONDS
        const resolvedPayload = await resolvePayload(data.payload, data.projectId, ctx.apiClient)

        const flowVersion = await flowCache(ctx.log, ctx.apiClient).getVersion({ flowVersionId: data.flowVersionIdToRun })
        if (isNil(flowVersion)) {
            ctx.log.info({ flowVersionId: data.flowVersionIdToRun }, 'Flow version not found for webhook, skipping')
            return { kind: JobResultKind.FIRE_AND_FORGET }
        }

        const { appWebhookUrl, webhookSecret } = getAppWebhookDetails(flowVersion, ctx.publicApiUrl, settings.APP_WEBHOOK_SECRETS)

        const provisioned = await provisionFlowPieces({ flowVersion, platformId: data.platformId, flowId: data.flowId, projectId: data.projectId, log: ctx.log, apiClient: ctx.apiClient })
        if (!provisioned) {
            return { kind: JobResultKind.FIRE_AND_FORGET }
        }

        const sandbox = ctx.sandboxManager.acquire({ log: ctx.log, apiClient: ctx.apiClient })
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
                        webhookUrl: getWebhookUrl(ctx.publicApiUrl, data.flowId, true),
                        triggerPayload: resolvedPayload as TriggerPayload,
                        test: true,
                        projectId: data.projectId,
                        platformId: data.platformId,
                        engineToken: ctx.engineToken,
                        internalApiUrl: ctx.internalApiUrl,
                        publicApiUrl: ctx.publicApiUrl,
                        timeoutInSeconds,
                        appWebhookUrl,
                        webhookSecret,
                    },
                    { timeoutInSeconds },
                )

                if (sampleResult.status === EngineResponseStatus.OK) {
                    const sampleTriggerResult = sampleResult.response as ExecuteTriggerResponse<TriggerHookType.RUN>
                    if (sampleTriggerResult.output.length > 0) {
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
                return { kind: JobResultKind.FIRE_AND_FORGET }
            }

            const result = await sandbox.execute(
                EngineOperationType.EXECUTE_TRIGGER_HOOK,
                {
                    hookType: TriggerHookType.RUN,
                    flowVersion,
                    webhookUrl: getWebhookUrl(ctx.publicApiUrl, data.flowId),
                    triggerPayload: resolvedPayload as TriggerPayload,
                    test: false,
                    projectId: data.projectId,
                    platformId: data.platformId,
                    engineToken: ctx.engineToken,
                    internalApiUrl: ctx.internalApiUrl,
                    publicApiUrl: ctx.publicApiUrl,
                    timeoutInSeconds,
                    appWebhookUrl,
                    webhookSecret,
                },
                { timeoutInSeconds },
            )

            if (result.status === EngineResponseStatus.OK) {
                const triggerResult = result.response as ExecuteTriggerResponse<TriggerHookType.RUN>
                if (triggerResult.output.length > 0) {
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

            return { kind: JobResultKind.FIRE_AND_FORGET, logs: result.logs }
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
