import {
    EngineOperationType,
    EngineResponseStatus,
    ExecuteTokenRefreshJobData,
    WorkerJobType,
} from '@activepieces/shared'
import { provisioner } from '../../cache/provisioner'
import { workerSettings } from '../../config/worker-settings'
import { JobContext, JobHandler, JobResultKind, SynchronousJobResult } from '../types'
import { isSandboxTimeout } from '../utils/sandbox-helpers'

export const executeTokenRefreshJob: JobHandler<ExecuteTokenRefreshJobData, SynchronousJobResult> = {
    jobType: WorkerJobType.EXECUTE_TOKEN_REFRESH,
    async execute(ctx: JobContext, data: ExecuteTokenRefreshJobData): Promise<SynchronousJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_TIMEOUT_SECONDS

        await provisioner(ctx.log, ctx.apiClient).provision({
            pieces: [data.piece],
            codeSteps: [],
        })

        const sandbox = ctx.sandboxManager.acquire({ log: ctx.log, apiClient: ctx.apiClient })
        try {
            await sandbox.start({
                flowVersionId: undefined,
                platformId: data.platformId,
                mounts: [],
            })

            const result = await sandbox.execute(
                EngineOperationType.EXECUTE_REFRESH_TOKEN_AUTH,
                {
                    piece: data.piece,
                    auth: data.connectionValue,
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
            if (isSandboxTimeout(e)) {
                return {
                    kind: JobResultKind.SYNCHRONOUS,
                    status: EngineResponseStatus.TIMEOUT,
                    response: { skipped: true },
                }
            }
            throw e
        }
        finally {
            await ctx.sandboxManager.release(ctx.log)
        }
    },
}
