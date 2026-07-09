import { tryCatch } from '@activepieces/core-utils'
import { CodeArtifact } from '@activepieces/sandbox'
import { DEFAULT_MCP_DATA, EngineOperationType, EngineResponseStatus, ExecuteActionJobData, FlowActionType, WorkerJobType } from '@activepieces/shared'
import { JobContext, JobHandler, JobResultKind, SynchronousJobResult } from '../types'
import { isSandboxTimeout } from '../utils/sandbox-helpers'

// Piece-run actions run synchronously while the caller waits on the API-side watcher, whose
// safety timeout is 5 minutes (WATCHER_SAFETY_TIMEOUT_MS). The sandbox timeout must stay well
// below that so a long-running step returns a clean TIMEOUT instead of the watcher giving up
// with an INTERNAL_ERROR. 120s matches the user-facing budget documented across the chat/MCP
// tooling and is the effective limit the old temp-flow path exposed via polling.
const PIECE_RUN_ACTION_TIMEOUT_SECONDS = 120

export const executeActionJob: JobHandler<ExecuteActionJobData, SynchronousJobResult> = {
    jobType: WorkerJobType.EXECUTE_ACTION,
    async execute(ctx: JobContext, data: ExecuteActionJobData): Promise<SynchronousJobResult> {
        const timeoutInSeconds = PIECE_RUN_ACTION_TIMEOUT_SECONDS

        const codes = toCodeArtifacts(data.step)
        const resolved = await ctx.resolver.resolve({ platformId: data.platformId, publicApiUrl: ctx.publicApiUrl, engineToken: ctx.engineToken, pieces: data.piece ? [data.piece] : [], codes })
        if (resolved.kind !== 'ready') {
            throw new Error(`Unexpected resolve outcome "${resolved.kind}" for piece-run action job`)
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
                    timeoutInSeconds,
                },
                timeoutInSeconds,
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
