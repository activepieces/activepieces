import {
    EngineOperationType,
    ExecuteExtractPieceMetadataJobData,
    WorkerJobType,
} from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { JobContext, JobHandler, JobResultKind, SynchronousJobResult } from '../types'

export const extractPieceInfoJob: JobHandler<ExecuteExtractPieceMetadataJobData, SynchronousJobResult> = {
    jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
    async execute(ctx: JobContext, data: ExecuteExtractPieceMetadataJobData): Promise<SynchronousJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_TIMEOUT_SECONDS

        try {
            const sandbox = await ctx.sandboxManager.ready({
                operation: { kind: 'PIECE', piece: data.piece, platformId: data.platformId },
                log: ctx.log,
                apiClient: ctx.apiClient,
            })

            const result = await sandbox.execute(
                EngineOperationType.EXTRACT_PIECE_METADATA,
                {
                    ...data.piece,
                    platformId: data.platformId,
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
            throw e
        }
        finally {
            await ctx.sandboxManager.release(ctx.log)
        }
    },
}
