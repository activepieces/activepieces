import { apId, JobData, StreamStepProgress, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'

const LegacyExecuteFlowFields = z.object({
    streamStepProgress: z.enum(StreamStepProgress).optional(),
    progressUpdateType: z.string().optional(),
    workerHandlerId: z.string().nullish(),
    synchronousHandlerId: z.string().nullish(),
})

function deriveExecuteFlowMigrationFields(job: JobData): { streamStepProgress: StreamStepProgress, workerHandlerId: string | null } {
    const legacy = LegacyExecuteFlowFields.parse(job)
    return {
        streamStepProgress: legacy.streamStepProgress ?? migrateProgressUpdateType(legacy.progressUpdateType),
        workerHandlerId: legacy.workerHandlerId ?? legacy.synchronousHandlerId ?? null,
    }
}

function createMigrations(log: FastifyBaseLogger): JobMigration[] {
    const enrichFlowId: JobMigration = {
        runAtSchemaVersion: 0,
        migrate: async (job: JobData) => {
            if (job.jobType === WorkerJobType.EXECUTE_FLOW) {
                const flowVersion = await flowVersionService(log).getOne(job.flowVersionId)
                const logsFileId = 'logsFileId' in job ? job.logsFileId : apId()
                return {
                    ...job,
                    flowId: flowVersion!.flowId,
                    schemaVersion: 4,
                    logsFileId,
                }
            }
            return {
                ...job,
                schemaVersion: 4,
            }
        },
    }
    const migratePayloadToUnion: JobMigration = {
        runAtSchemaVersion: 4,
        migrate: async (job: JobData) => {
            if (job.jobType === WorkerJobType.EXECUTE_FLOW || job.jobType === WorkerJobType.EXECUTE_WEBHOOK) {
                return {
                    ...job,
                    schemaVersion: 5,
                    payload: { type: 'inline', value: job.payload },
                }
            }
            return { ...job, schemaVersion: 5 }
        },
    }
    const renameProgressAndHandlerFields: JobMigration = {
        runAtSchemaVersion: 5,
        migrate: async (job: JobData) => {
            if (job.jobType === WorkerJobType.EXECUTE_FLOW) {
                return {
                    ...job,
                    schemaVersion: 6,
                    ...deriveExecuteFlowMigrationFields(job),
                }
            }
            return { ...job, schemaVersion: 6 }
        },
    }
    const dropLogsUploadUrl: JobMigration = {
        runAtSchemaVersion: 6,
        migrate: async (job: JobData) => {
            if (job.jobType !== WorkerJobType.EXECUTE_FLOW) {
                return { ...job, schemaVersion: 7 }
            }
            const legacy = job as Record<string, unknown>
            delete legacy['logsUploadUrl']
            return {
                ...job,
                schemaVersion: 7,
            }
        },
    }
    const backfillRequiredExecuteFlowFields: JobMigration = {
        runAtSchemaVersion: 7,
        migrate: async (job: JobData) => {
            if (job.jobType !== WorkerJobType.EXECUTE_FLOW) {
                return { ...job, schemaVersion: 8 }
            }
            return {
                ...job,
                schemaVersion: 8,
                ...deriveExecuteFlowMigrationFields(job),
            }
        },
    }

    return [enrichFlowId, migratePayloadToUnion, renameProgressAndHandlerFields, dropLogsUploadUrl, backfillRequiredExecuteFlowFields]
}

function migrateProgressUpdateType(progressUpdateType: string | undefined): StreamStepProgress {
    if (progressUpdateType === 'TEST_FLOW' || progressUpdateType === 'WEBHOOK_RESPONSE') {
        return StreamStepProgress.WEBSOCKET
    }
    return StreamStepProgress.NONE
}

export const jobMigrations = (log: FastifyBaseLogger) => ({
    apply: async (job: Record<string, unknown>): Promise<JobData> => {
        let jobData = job as JobData
        log.info({
            schemaVersion: jobData.schemaVersion,
            jobType: jobData.jobType,
            projectId: jobData.projectId,
        }, '[jobMigrations] Apply migration for job')
        const migrations = createMigrations(log)
        for (const migration of migrations) {
            const schemaVersion = getSchemaVersion(jobData)
            if (schemaVersion === migration.runAtSchemaVersion) {
                jobData = await migration.migrate(jobData)
            }
        }
        return jobData
    },
})

function getSchemaVersion(job: JobData): number {
    return 'schemaVersion' in job ? job.schemaVersion : 0
}


type JobMigration = {
    runAtSchemaVersion: number
    migrate: (job: JobData) => Promise<JobData>
}
