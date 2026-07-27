import { spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { CodeArtifact } from '@activepieces/sandbox'
import { cryptoUtils } from '@activepieces/server-utils'
import { DEFAULT_MCP_DATA, EngineOperationType, EngineResponseStatus, ExecuteActionJobData, FlowActionType, WorkerJobType } from '@activepieces/shared'
import { JobContext, JobHandler, JobResultKind, SynchronousJobResult } from '../types'
import { isSandboxTimeout, sandboxTimeoutNeverStarted } from '../utils/sandbox-helpers'

const ACTION_RUN_ACTION_TIMEOUT_SECONDS = 120

export const executeActionJob: JobHandler<ExecuteActionJobData, SynchronousJobResult> = {
    jobType: WorkerJobType.EXECUTE_ACTION,
    async execute(ctx: JobContext, data: ExecuteActionJobData): Promise<SynchronousJobResult> {
        const { codes, namespace: codeNamespace } = await resolveCodeStep(data.step)
        const resolved = await ctx.resolver.resolve({ platformId: data.platformId, publicApiUrl: ctx.publicApiUrl, engineToken: ctx.engineToken, pieces: data.piece ? [data.piece] : [], codes })
        if (resolved.kind !== 'ready') {
            throw new Error(`Unexpected resolve outcome "${resolved.kind}" for action-run action job`)
        }

        const { data: result, error } = await tryCatch(async () => {
            return ctx.runtime.execute({
                workerIndex: ctx.workerIndex,
                log: ctx.log,
                operationType: EngineOperationType.EXECUTE_ACTION,
                operation: {
                    step: data.step,
                    projectId: data.projectId,
                    platformId: data.platformId,
                    engineToken: ctx.engineToken,
                    internalApiUrl: ctx.internalApiUrl,
                    publicApiUrl: ctx.publicApiUrl,
                    timeoutInSeconds: ACTION_RUN_ACTION_TIMEOUT_SECONDS,
                    ...spreadIfDefined('flowVersionId', codeNamespace),
                },
                timeoutInSeconds: ACTION_RUN_ACTION_TIMEOUT_SECONDS,
                expiresAt: data.expiresAt,
                provision: { ...resolved.provision, ...spreadIfDefined('flowVersionId', codeNamespace) },
            })
        })

        if (error) {
            if (isSandboxTimeout(error)) {
                return {
                    kind: JobResultKind.SYNCHRONOUS,
                    status: EngineResponseStatus.TIMEOUT,
                    response: { success: false, input: {}, output: null, neverStarted: sandboxTimeoutNeverStarted(error) },
                }
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

async function resolveCodeStep(step: ExecuteActionJobData['step']): Promise<{ codes: CodeArtifact[], namespace?: string }> {
    if (step.type !== FlowActionType.CODE) {
        return { codes: [] }
    }
    const namespace = await cryptoUtils.hashObject(step.settings.sourceCode)
    return {
        namespace,
        codes: [{
            name: step.name,
            sourceCode: step.settings.sourceCode,
            flowVersionId: namespace,
            flowVersionState: DEFAULT_MCP_DATA.flowVersionState,
        }],
    }
}
