import { isNil, parseToJsonIfPossible, tryCatch } from '@activepieces/core-utils'
import { EngineOperationType, EngineResponseStatus, ExecuteTriggerResponse, FlowVersion, PieceTrigger, StreamStepProgress, TriggerHookType, TriggerRunStatus, WebhookJobData, WorkerJobType } from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../types'
import { isSandboxTimeout } from '../utils/sandbox-helpers'
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

        const resolved = await ctx.resolver.resolve({ platformId: data.platformId, publicApiUrl: ctx.publicApiUrl, engineToken: ctx.engineToken, flow: { id: data.flowId, versionId: data.flowVersionIdToRun, projectId: data.projectId } })

        if (resolved.kind === 'flow-not-found') {
            ctx.log.info({ flowVersion: { id: data.flowVersionIdToRun } }, 'Flow version not found for webhook, skipping')
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        if (resolved.kind === 'disabled') {
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        // resolved.kind === 'ready' — flowVersion is guaranteed present when flow: is passed to resolve
        if (isNil(resolved.flowVersion)) {
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.INTERNAL_ERROR }
        }
        const flowVersion: FlowVersion = resolved.flowVersion
        const pieceName = (flowVersion.trigger as PieceTrigger).settings?.pieceName

        const saveTriggerStats = async (status: TriggerRunStatus) => {
            if (isNil(pieceName)) return
            const { error: statsError } = await tryCatch(() =>
                ctx.apiClient.saveTriggerRunStats({ platformId: data.platformId, pieceName, status }),
            )
            if (statsError) {
                ctx.log.warn({ error: String(statsError) }, 'Failed to save trigger run stats, non-fatal')
            }
        }


        const { appWebhookUrl, webhookSecret } = getAppWebhookDetails(flowVersion, ctx.publicApiUrl, settings.APP_WEBHOOK_SECRETS)

        const { data: execResult, error } = await tryCatch(async () => {
            if (data.saveSampleData) {
                const sampleResult = await ctx.runtime.execute({
                    workerIndex: ctx.workerIndex,
                    log: ctx.log,
                    operationType: EngineOperationType.EXECUTE_TRIGGER_HOOK,
                    operation: {
                        hookType: TriggerHookType.RUN,
                        flowVersion,
                        webhookUrl: getWebhookUrl(ctx.publicApiUrl, data.flowId, true),
                        triggerPayload: data.payload,
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
                    timeoutInSeconds,
                    provision: resolved.provision,
                })

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
                return null
            }

            const result = await ctx.runtime.execute({
                workerIndex: ctx.workerIndex,
                log: ctx.log,
                operationType: EngineOperationType.EXECUTE_TRIGGER_HOOK,
                operation: {
                    hookType: TriggerHookType.RUN,
                    flowVersion,
                    webhookUrl: getWebhookUrl(ctx.publicApiUrl, data.flowId),
                    triggerPayload: data.payload,
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
                timeoutInSeconds,
                provision: resolved.provision,
            })

            return result
        })

        if (error) {
            await saveTriggerStats(TriggerRunStatus.FAILED)

            if (isSandboxTimeout(error)) {
                ctx.log.warn({ flowVersion: { id: data.flowVersionIdToRun } }, 'Webhook execution timed out in sandbox')
                return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
            }
            throw error
        }

        if (isNil(execResult)) {
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        if (execResult.status === EngineResponseStatus.OK) {
            const triggerResult = execResult.response as ExecuteTriggerResponse<TriggerHookType.RUN>
            if (triggerResult.output.length > 0) {
                await ctx.apiClient.submitPayloads({
                    flowVersionId: flowVersion.id,
                    projectId: data.projectId,
                    payloads: triggerResult.output,
                    httpRequestId: data.requestId,
                    environment: data.runEnvironment,
                    streamStepProgress: StreamStepProgress.NONE,
                    parentRunId: data.parentRunId,
                    failParentOnFailure: data.failParentOnFailure,
                })
            }
            await saveTriggerStats(TriggerRunStatus.COMPLETED)
        }
        else {
            await saveTriggerStats(TriggerRunStatus.FAILED)
        }

        return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK, logs: execResult.logs }
    },
}
