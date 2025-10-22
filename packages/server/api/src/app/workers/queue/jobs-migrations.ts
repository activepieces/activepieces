import { apId, JobData, UploadLogsBehavior, WorkerJobType } from '@activepieces/shared'
import { flowRunLogsService } from '../../flows/flow-run/logs/flow-run-logs-service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { system } from '../../helper/system/system'

const enrichFlowIdAndLogsUrl: JobMigration = {
    targetSchemaVersion: 5,
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
                schemaVersion: 5,
                logsFileId,
                logsUploadUrl,
            }
        }
        return {
            ...job,
            schemaVersion: 5,
        }
    },
}

const migrations: JobMigration[] = [
    enrichFlowIdAndLogsUrl,
]

export const jobMigrations = {
    apply: async (job: Record<string, unknown>): Promise<JobData> => {

        const jobData = job as JobData
        for (const migration of migrations) {
            const schemaVersion = 'schemaVersion' in jobData ? jobData.schemaVersion : 0
            if (schemaVersion === migration.targetSchemaVersion) {
                return migration.migrate(jobData)
            }
        }
        return jobData
    },
}


type JobMigration = {
    targetSchemaVersion: number
    migrate: (job: JobData) => Promise<JobData>
}
