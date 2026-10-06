import { apId, isNil } from '@activepieces/core-utils'
import { EngineResponseStatus, ExecuteAiJobData } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineResponseWatcher } from '../workers/engine-response-watcher'
import { jobQueue, JobType } from '../workers/job-queue/job-queue'

export const aiExecution = (log: FastifyBaseLogger) => ({
    serverId(): string {
        return engineResponseWatcher(log).getServerId()
    },
    async enqueue(data: ExecuteAiJobData): Promise<void> {
        await jobQueue(log).add({ id: apId(), type: JobType.ONE_TIME, data })
    },
    async waitForAnswer({ requestId, timeoutMs }: { requestId: string, timeoutMs: number }): Promise<AiStepAnswer> {
        const response = await engineResponseWatcher(log).oneTimeListener<WorkerResponse | undefined>(requestId, true, timeoutMs, undefined)
        if (isNil(response)) {
            return { failure: 'The AI step did not finish in time' }
        }
        if (response.status !== EngineResponseStatus.OK) {
            return { failure: response.error ?? 'The AI step failed' }
        }
        return response.response ?? { failure: 'The AI step reported nothing back' }
    },
})

export type AiStepAnswer = {
    output?: unknown
    failure?: string
}

type WorkerResponse = {
    status: EngineResponseStatus
    response?: AiStepAnswer
    error?: string
}
