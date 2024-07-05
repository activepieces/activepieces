import { ApQueueJob, JobStatus, QueueName } from '@activepieces/server-shared'

export type ConsumerManager = {
    init(): Promise<void>
    poll<T extends QueueName>(groupId: string | null, queueName: T): Promise<Omit<ApQueueJob, 'engineToken'> | null>
    update(groupId: string | null, params: UpdateParams): Promise<void>
    close(): Promise<void>
}

type UpdateParams = {
    jobId: string
    queueName: QueueName
    status: JobStatus
    message: string
}