import {
    EngineOperationType,
    EngineResponseStatus,
    ExecuteTokenRefreshJobData,
    WorkerJobType,
} from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { JobContext, JobHandler, JobResultKind, SynchronousJobResult } from '../types'
import { isSandboxTimeout } from '../utils/sandbox-helpers'

export const executeTokenRefreshJob: JobHandler<ExecuteTokenRefreshJobData, SynchronousJobResult> = {
    jobType: WorkerJobType.EXECUTE_TOKEN_REFRESH,
    async execute(ctx: JobContext, data: ExecuteTokenRefreshJobData): Promise<SynchronousJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_TIMEOUT_SECONDS

        const execution = ctx.runtime.createExecution({ workerIndex: ctx.workerIndex, log: ctx.log, apiClient: ctx.apiClient })
        await execution.provision({ platformId: data.platformId, pieces: [data.piece] })

        try {
            const result = await execution.run({
                operationType: EngineOperationType.EXECUTE_REFRESH_TOKEN_AUTH,
                operation: {
                    piece: data.piece,
                    auth: data.connectionValue,
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
        catch (error) {
            await execution.dispose({ invalidate: true })
            if (isSandboxTimeout(error)) {
                return {
                    kind: JobResultKind.SYNCHRONOUS,
                    status: EngineResponseStatus.TIMEOUT,
                    response: { skipped: true },
                }
            }
            throw error
        }
        finally {
            await execution.dispose({ invalidate: false })
        }
    },
}
