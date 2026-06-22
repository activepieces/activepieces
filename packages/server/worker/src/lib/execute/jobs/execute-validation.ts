import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { AppConnectionValue, EngineOperationType, EngineResponseStatus, ExecuteValidateAuthJobData, WorkerJobType } from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { JobContext, JobHandler, JobResultKind, SynchronousJobResult } from '../types'

export const executeValidationJob: JobHandler<ExecuteValidateAuthJobData, SynchronousJobResult> = {
    jobType: WorkerJobType.EXECUTE_VALIDATION,
    async execute(ctx: JobContext, data: ExecuteValidateAuthJobData): Promise<SynchronousJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_TIMEOUT_SECONDS

        const execution = ctx.runtime.createExecution({ workerIndex: ctx.workerIndex, log: ctx.log, apiClient: ctx.apiClient })
        await execution.provision({ platformId: data.platformId, pieces: [data.piece] })

        try {
            const result = await execution.run({
                operationType: EngineOperationType.EXECUTE_VALIDATE_AUTH,
                operation: {
                    piece: data.piece,
                    auth: data.connectionValue as AppConnectionValue,
                    platformId: data.platformId,
                    engineToken: ctx.engineToken,
                    internalApiUrl: ctx.internalApiUrl,
                    publicApiUrl: ctx.publicApiUrl,
                    timeoutInSeconds,
                },
                timeoutInSeconds,
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
            await execution.dispose({ invalidate: true })
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
            await execution.dispose({ invalidate: false })
        }
    },
}
