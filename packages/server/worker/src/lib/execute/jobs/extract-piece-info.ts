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

        const resolved = await ctx.resolver.resolve({ platformId: data.platformId, publicApiUrl: ctx.publicApiUrl, engineToken: ctx.engineToken, pieces: [data.piece] })
        if (resolved.kind !== 'ready') {
            throw new Error(`Unexpected resolve outcome "${resolved.kind}" for piece-only job`)
        }

        const result = await ctx.runtime.execute({
            workerIndex: ctx.workerIndex,
            log: ctx.log,
            operationType: EngineOperationType.EXTRACT_PIECE_METADATA,
            operation: {
                ...data.piece,
                platformId: data.platformId,
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
    },
}
