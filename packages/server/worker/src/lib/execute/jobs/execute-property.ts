import {
    EngineOperationType,
    ExecutePropertyJobData,
    WorkerJobType,
} from '@activepieces/shared'
import { provisioner } from '../../cache/provisioner'
import { workerSettings } from '../../config/worker-settings'
import { createSandboxForJob } from '../create-sandbox-for-job'
import { JobContext, JobHandler, JobResult } from '../types'

export const executePropertyJob: JobHandler<ExecutePropertyJobData> = {
    jobType: WorkerJobType.EXECUTE_PROPERTY,
    async execute(ctx: JobContext, data: ExecutePropertyJobData): Promise<JobResult> {
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
                EngineOperationType.EXECUTE_PROPERTY,
                {
                    piece: data.piece,
                    propertyName: data.propertyName,
                    actionOrTriggerName: data.actionOrTriggerName,
                    flowVersion: data.flowVersion,
                    input: data.input,
                    sampleData: data.sampleData,
                    projectId: data.projectId,
                    searchValue: data.searchValue,
                    platformId: data.platformId,
                    engineToken: ctx.engineToken,
                    internalApiUrl: ctx.internalApiUrl,
                    publicApiUrl: ctx.publicApiUrl,
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
