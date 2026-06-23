import { tryCatch } from '@activepieces/core-utils'
import { EngineOperationType, EngineResponseStatus, ExecutePropertyJobData, WorkerJobType } from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { JobContext, JobHandler, JobResultKind, SynchronousJobResult } from '../types'
import { isSandboxTimeout } from '../utils/sandbox-helpers'

export const executePropertyJob: JobHandler<ExecutePropertyJobData, SynchronousJobResult> = {
    jobType: WorkerJobType.EXECUTE_PROPERTY,
    async execute(ctx: JobContext, data: ExecutePropertyJobData): Promise<SynchronousJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().TRIGGER_TIMEOUT_SECONDS

        const execution = ctx.runtime.createExecution({ workerIndex: ctx.workerIndex, log: ctx.log, apiClient: ctx.apiClient })
        await execution.provision({ platformId: data.platformId, pieces: [data.piece] })

        const { data: result, error } = await tryCatch(async () => {
            return execution.run({
                operationType: EngineOperationType.EXECUTE_PROPERTY,
                operation: {
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
                timeoutInSeconds,
            })
        })
        await execution.dispose({ invalidate: false })

        if (error) {
            await execution.dispose({ invalidate: true })
            if (isSandboxTimeout(error)) {
                return { kind: JobResultKind.SYNCHRONOUS, status: EngineResponseStatus.TIMEOUT, response: {} }
            }
            throw error
        }

        return {
            kind: JobResultKind.SYNCHRONOUS,
            status: result.status,
            response: result.response,
            errorMessage: result.error,
            logs: result.logs,
        }
    },
}
