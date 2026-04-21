import { apId, JobData, StreamStepProgress, UploadLogsBehavior, UploadLogsToken, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRunLogsService } from '../../flows/flow-run/logs/flow-run-logs-service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { jwtUtils } from '../../helper/jwt-utils'

function createMigrations(log: FastifyBaseLogger): JobMigration[] {
    const enrichFlowIdAndLogsUrl: JobMigration = {
        runAtSchemaVersion: 0,
        migrate: async (job: JobData) => {
            if (job.jobType === WorkerJobType.EXECUTE_FLOW) {
                const flowVersion = await flowVersionService(log).getOne(job.flowVersionId)
                const logsFileId = 'logsFileId' in job ? job.logsFileId : apId()
                const logsUploadUrl = await flowRunLogsService(log).constructUploadUrl({
                    logsFileId,
                    projectId: job.projectId,
                    flowRunId: job.runId,
                    behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
                })
                return {
                    ...job,
                    flowId: flowVersion!.flowId,
                    schemaVersion: 4,
                    logsFileId,
                    logsUploadUrl,
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
                const legacy = job as Record<string, unknown>
                const streamStepProgress: StreamStepProgress = (legacy['streamStepProgress'] as StreamStepProgress | undefined) ?? migrateProgressUpdateType(legacy['progressUpdateType'] as string | undefined)
                const workerHandlerId: string | null = (legacy['workerHandlerId'] as string | undefined) ?? (legacy['synchronousHandlerId'] as string | undefined) ?? null
                return {
                    ...job,
                    schemaVersion: 6,
                    streamStepProgress,
                    workerHandlerId,
                }
            }
            return { ...job, schemaVersion: 6 }
        },
    }
    const reSignLogsUploadUrlWithAudience: JobMigration = {
        runAtSchemaVersion: 6,
        migrate: async (job: JobData) => {
            if (job.jobType !== WorkerJobType.EXECUTE_FLOW) {
                return { ...job, schemaVersion: 7 }
            }
            const behavior = extractLogsBehaviorFromUrl(job.logsUploadUrl) ?? UploadLogsBehavior.UPLOAD_DIRECTLY
            const logsUploadUrl = await flowRunLogsService(log).constructUploadUrl({
                logsFileId: job.logsFileId,
                projectId: job.projectId,
                flowRunId: job.runId,
                behavior,
            })
            return {
                ...job,
                schemaVersion: 7,
                logsUploadUrl,
            }
        },
    }

    return [enrichFlowIdAndLogsUrl, migratePayloadToUnion, renameProgressAndHandlerFields, reSignLogsUploadUrlWithAudience]
}

function extractLogsBehaviorFromUrl(url: string): UploadLogsBehavior | null {
    const queryIndex = url.indexOf('?')
    if (queryIndex === -1) {
        return null
    }
    const token = new URLSearchParams(url.slice(queryIndex + 1)).get('token')
    if (token === null) {
        return null
    }
    const decoded = jwtUtils.decode<UploadLogsToken>({ jwt: token })
    return decoded?.payload?.behavior ?? null
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
