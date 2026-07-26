import { tryCatch } from '@activepieces/core-utils'
import { CodeArtifact } from '@activepieces/sandbox'
import { DEFAULT_MCP_DATA, EngineOperationType, EngineResponseStatus, ExecuteActionJobData, FlowActionType, WorkerJobType } from '@activepieces/shared'
import { JobContext, JobHandler, JobResultKind, SynchronousJobResult } from '../types'
import { isSandboxTimeout } from '../utils/sandbox-helpers'

// The caller's `expiresAt` is the real budget (see actionRunService) and the runtime clamps the run
// to whatever is left of it after provisioning. This cap is the worker's own ceiling for a deadline
// it cannot trust — a missing one from an older API, or one inflated by clock skew — and matches the
// user-facing budget documented across the chat/MCP tooling.
const ACTION_RUN_ACTION_TIMEOUT_SECONDS = 120

export const executeActionJob: JobHandler<ExecuteActionJobData, SynchronousJobResult> = {
    jobType: WorkerJobType.EXECUTE_ACTION,
    async execute(ctx: JobContext, data: ExecuteActionJobData): Promise<SynchronousJobResult> {
        const codes = toCodeArtifacts(data.step)
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
                },
                timeoutInSeconds: ACTION_RUN_ACTION_TIMEOUT_SECONDS,
                expiresAt: data.expiresAt,
                provision: resolved.provision,
            })
        })

        if (error) {
            if (isSandboxTimeout(error)) {
                return { kind: JobResultKind.SYNCHRONOUS, status: EngineResponseStatus.TIMEOUT, response: {} }
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

function toCodeArtifacts(step: ExecuteActionJobData['step']): CodeArtifact[] {
    if (step.type !== FlowActionType.CODE) {
        return []
    }
    return [{
        name: step.name,
        sourceCode: step.settings.sourceCode,
        flowVersionId: DEFAULT_MCP_DATA.flowVersionId,
        flowVersionState: DEFAULT_MCP_DATA.flowVersionState,
    }]
}
