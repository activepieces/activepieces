import {
    ActivepiecesError,
    AppConnectionValue,
    EngineOperationType,
    EngineResponseStatus,
    ErrorCode,
    ExecuteValidateAuthJobData,
    WorkerJobType,
} from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { JobContext, JobHandler, JobResultKind, SynchronousJobResult } from '../types'

export const executeValidationJob: JobHandler<ExecuteValidateAuthJobData, SynchronousJobResult> = {
    jobType: WorkerJobType.EXECUTE_VALIDATION,
    async execute(ctx: JobContext, data: ExecuteValidateAuthJobData): Promise<SynchronousJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_TIMEOUT_SECONDS

        try {
            const sandbox = await ctx.sandboxManager.ready({
                operation: { kind: 'PIECE', piece: data.piece, platformId: data.platformId },
                log: ctx.log,
                apiClient: ctx.apiClient,
            })

            const result = await sandbox.execute(
                EngineOperationType.EXECUTE_VALIDATE_AUTH,
                {
                    piece: data.piece,
                    auth: data.connectionValue as AppConnectionValue,
                    platformId: data.platformId,
                    engineToken: ctx.engineToken,
                    internalApiUrl: ctx.internalApiUrl,
                    publicApiUrl: ctx.publicApiUrl,
                    timeoutInSeconds,
                },
                { timeoutInSeconds },
            )

            return {
                kind: JobResultKind.SYNCHRONOUS,
                status: result.status,
                response: result.response,
                errorMessage: result.error,
                logs: result.logs,
            }
        }
        catch (e) {
            await ctx.sandboxManager.invalidate(ctx.log)
            if (e instanceof ActivepiecesError && e.error.code === ErrorCode.SANDBOX_EXECUTION_TIMEOUT) {
                return {
                    kind: JobResultKind.SYNCHRONOUS,
                    status: EngineResponseStatus.TIMEOUT,
                    response: { valid: false, error: 'Validation timed out' },
                }
            }
            throw e
        }
        finally {
            await ctx.sandboxManager.release(ctx.log)
        }
    },
}
