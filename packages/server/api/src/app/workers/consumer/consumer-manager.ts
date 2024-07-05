import { ApQueueJob, JobStatus, QueueName } from '@activepieces/server-shared'

export type ConsumerManager = {
    init(): Promise<void>
    poll<T extends QueueName>(queueName: T): Promise<Omit<ApQueueJob, 'engineToken'> | null>
    update(params: UpdateParams): Promise<void>
    close(): Promise<void>
}

type UpdateParams = {
    jobId: string
    queueName: QueueName
    status: JobStatus
    message: string
}