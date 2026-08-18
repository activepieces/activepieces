import { AppConnectionValue, EngineOperationType, EngineResponseStatus, ExecuteValidateAuthJobData, WorkerJobType } from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { JobContext, JobHandler, JobResultKind, SynchronousJobResult } from '../types'
import { isSandboxTimeout } from '../utils/sandbox-helpers'
import { buildSynchronousResult } from '../utils/synchronous-result'

export const executeValidationJob: JobHandler<ExecuteValidateAuthJobData, SynchronousJobResult> = {
    jobType: WorkerJobType.EXECUTE_VALIDATION,
    async execute(ctx: JobContext, data: ExecuteValidateAuthJobData): Promise<SynchronousJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_TIMEOUT_SECONDS

        const resolved = await ctx.resolver.resolve({ platformId: data.platformId, publicApiUrl: ctx.publicApiUrl, engineToken: ctx.engineToken, pieces: [data.piece] })
        if (resolved.kind !== 'ready') {
            throw new Error(`Unexpected resolve outcome "${resolved.kind}" for piece-only job`)
        }

        try {
            const result = await ctx.runtime.execute({
                workerIndex: ctx.workerIndex,
                log: ctx.log,
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
                provision: resolved.provision,
            })

            return buildSynchronousResult(result)
        }
        catch (e) {
            if (isSandboxTimeout(e)) {
                return {
                    kind: JobResultKind.SYNCHRONOUS,
                    status: EngineResponseStatus.TIMEOUT,
                    response: { valid: false, error: 'Validation timed out' },
                }
            }
            throw e
        }
    },
}
