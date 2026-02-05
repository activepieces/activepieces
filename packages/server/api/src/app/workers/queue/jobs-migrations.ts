import { apId, JobData, UploadLogsBehavior, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRunLogsService } from '../../flows/flow-run/logs/flow-run-logs-service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { system } from '../../helper/system/system'

const enrichFlowIdAndLogsUrl: JobMigration = {
    runAtSchemaVersion: 0,
    migrate: async (job: JobData) => {
        if (job.jobType === WorkerJobType.EXECUTE_FLOW) {
            const flowVersion = await flowVersionService(system.globalLogger()).getOne(job.flowVersionId)
            const logsFileId = 'logsFileId' in job ? job.logsFileId : apId()
            const logsUploadUrl = await flowRunLogsService(system.globalLogger()).constructUploadUrl({
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

const migrations: JobMigration[] = [
    enrichFlowIdAndLogsUrl,
]
export const jobMigrations = (log: FastifyBaseLogger) => ({
    apply: async (job: Record<string, unknown>): Promise<JobData> => {
        let jobData = job as JobData
        log.info({
            schemaVersion: jobData.schemaVersion,
            jobType: jobData.jobType,
            projectId: jobData.projectId,
        }, '[jobMigrations] Apply migration for job')
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
