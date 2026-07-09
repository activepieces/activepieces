import { apId, spreadIfDefined } from '@activepieces/core-utils'
import { ChatPromptOverride, LATEST_JOB_DATA_SCHEMA_VERSION, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { jobQueue, JobType } from '../../workers/job-queue/job-queue'

// Single builder for every EXECUTE_CHAT_AGENT enqueue (controller send, gate/crash resume, eval
// simulate + turn/start), so the schema version and job wrapper live in one place instead of being
// hand-assembled at each site. Optional fields are only included when provided so the enqueued data
// matches the previous hand-built payloads exactly.
async function enqueueChatAgentJob({ conversationId, runId, projectId, platformId, userId, userMessage, modelName, files, promptOverride, dryRun, discoveryOnly, resumeKind, log }: {
    conversationId: string
    runId?: string
    projectId: string | null
    platformId: string
    userId: string
    userMessage: string
    modelName: string | null
    files?: Array<{ name: string, mimeType: string, data: string }>
    promptOverride?: ChatPromptOverride
    dryRun?: boolean
    discoveryOnly?: boolean
    resumeKind?: 'gate' | 'crash'
    log: FastifyBaseLogger
}): Promise<void> {
    await jobQueue(log).add({
        id: apId(),
        type: JobType.ONE_TIME,
        data: {
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            jobType: WorkerJobType.EXECUTE_CHAT_AGENT,
            conversationId,
            ...spreadIfDefined('runId', runId),
            projectId,
            platformId,
            userId,
            userMessage,
            modelName,
            ...spreadIfDefined('files', files),
            ...spreadIfDefined('promptOverride', promptOverride),
            ...spreadIfDefined('dryRun', dryRun),
            ...spreadIfDefined('discoveryOnly', discoveryOnly),
            ...spreadIfDefined('resumeKind', resumeKind),
        },
    })
}

export const chatJob = {
    enqueueChatAgentJob,
}
