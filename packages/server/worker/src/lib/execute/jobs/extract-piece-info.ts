import {
    EngineOperationType,
    ExecuteExtractPieceMetadataJobData,
    WorkerJobType,
} from '@activepieces/shared'
import { provisioner } from '../../cache/provisioner'
import { workerSettings } from '../../config/worker-settings'
import { createSandboxForJob } from '../create-sandbox-for-job'
import { JobContext, JobHandler, JobResult } from '../types'

export const extractPieceInfoJob: JobHandler<ExecuteExtractPieceMetadataJobData> = {
    jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
    async execute(ctx: JobContext, data: ExecuteExtractPieceMetadataJobData): Promise<JobResult> {
        const settings = workerSettings.getSettings()
        const timeoutInSeconds = settings.TRIGGER_TIMEOUT_SECONDS

        await provisioner(ctx.log, ctx.apiClient).provision({
            pieces: [data.piece],
            codeSteps: [],
        })

        const sandbox = createSandboxForJob({ log: ctx.log, apiClient: ctx.apiClient })
        try {
            await sandbox.start({
                flowVersionId: undefined,
                platformId: data.platformId,
                mounts: [],
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
                response: {
                    status: result.engine.status,
                    response: result.engine.response,
                },
            }
        }
        finally {
            await sandbox.shutdown()
        }
    },
}
