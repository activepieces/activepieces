import { spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { CodeArtifact } from '@activepieces/sandbox'
import { cryptoUtils } from '@activepieces/server-utils'
import { DEFAULT_MCP_DATA, EngineOperationType, EngineResponseStatus, ExecuteActionJobData, FlowActionType, WorkerJobType } from '@activepieces/shared'
import { JobContext, JobHandler, JobResultKind, SynchronousJobResult } from '../types'
import { isSandboxTimeout, sandboxTimeoutNeverStarted } from '../utils/sandbox-helpers'

// The caller's `expiresAt` is the real budget (see actionRunService) and the runtime clamps the run
// to whatever is left of it after provisioning. This cap is the worker's own ceiling for a deadline
// it cannot trust — a missing one from an older API, or one inflated by clock skew — and matches the
// user-facing budget documented across the chat/MCP tooling.
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

// The code cache is namespaced by `flowVersionId` + step name only, and an action run has neither a
// flow version nor a unique step name. Hashing the source gives a namespace that is unique per
// snippet, mounts correctly in isolate mode, and — because it is the very value code-builder stores
// as its cache-state key — can never mismatch, so the destructive rebuild branch is unreachable.
// The namespace and the artifact are returned together because the mount, the compiled path and the
// engine's read path must all agree on it.
// ponytail: one dir per distinct snippet, forever; no GC exists for the flow code cache either.
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
