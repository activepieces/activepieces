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

        const execution = ctx.runtime.createExecution({ workerIndex: ctx.workerIndex, log: ctx.log, apiClient: ctx.apiClient })
        await execution.init({ flowVersionId: undefined, platformId: data.platformId })

        try {
            await execution.provision({ pieces: [data.piece], codeSteps: [] })
            const result = await execution.run({
                operationType: EngineOperationType.EXTRACT_PIECE_METADATA,
                operation: {
                    ...data.piece,
                    platformId: data.platformId,
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
            throw e
        }
        finally {
            await execution.dispose({ invalidate: false })
        }
    },
}
