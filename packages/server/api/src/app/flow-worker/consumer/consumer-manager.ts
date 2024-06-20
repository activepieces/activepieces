import { JobStatus, QueueName } from '@activepieces/server-shared'
import { JobData } from 'server-worker'

export type PollResponse = {
    data: JobData
    id: string
} | undefined
export type ConsumerManager = {
    init(): Promise<void>
    poll<T extends QueueName>(queueName: T, token: string): Promise<PollResponse>
    update(params: UpdateParams): Promise<void>
    close(): Promise<void>
}

type UpdateParams = {
    jobId: string
    queueName: QueueName
    status: JobStatus
    message: string
    token: string
}