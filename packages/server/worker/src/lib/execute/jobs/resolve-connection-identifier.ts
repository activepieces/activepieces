import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { EngineOperationType, EngineResponseStatus, ExecuteResolveConnectionIdentifierJobData, WorkerJobType } from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { JobContext, JobHandler, JobResultKind, SynchronousJobResult } from '../types'

export const resolveConnectionIdentifierJob: JobHandler<ExecuteResolveConnectionIdentifierJobData, SynchronousJobResult> = {
    jobType: WorkerJobType.EXECUTE_RESOLVE_CONNECTION_IDENTIFIER,
    async execute(ctx: JobContext, data: ExecuteResolveConnectionIdentifierJobData): Promise<SynchronousJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_TIMEOUT_SECONDS

        const resolved = await ctx.resolver.resolve({ platformId: data.platformId, publicApiUrl: ctx.publicApiUrl, engineToken: ctx.engineToken, pieces: [data.piece] })
        if (resolved.kind !== 'ready') {
            throw new Error(`Unexpected resolve outcome "${resolved.kind}" for piece-only job`)
        }

        try {
            const result = await ctx.runtime.execute({
                workerIndex: ctx.workerIndex,
                log: ctx.log,
                operationType: EngineOperationType.EXECUTE_RESOLVE_CONNECTION_IDENTIFIER,
                operation: {
                    piece: data.piece,
                    auth: data.connectionValue,
                    connectionType: data.connectionType,
                    platformId: data.platformId,
                    engineToken: ctx.engineToken,
                    internalApiUrl: ctx.internalApiUrl,
                    publicApiUrl: ctx.publicApiUrl,
                    timeoutInSeconds,
                },
                timeoutInSeconds,
                provision: resolved.provision,
            })

            return {
                kind: JobResultKind.SYNCHRONOUS,
                status: result.status,
                response: result.response,
                errorMessage: result.error,
                logs: result.logs,
            }
        }
        catch (e) {
            if (e instanceof ActivepiecesError && e.error.code === ErrorCode.SANDBOX_EXECUTION_TIMEOUT) {
                return {
                    kind: JobResultKind.SYNCHRONOUS,
                    status: EngineResponseStatus.TIMEOUT,
                    response: { identifier: undefined },
                }
            }
            throw e
        }
    },
}
