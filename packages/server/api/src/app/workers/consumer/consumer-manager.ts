import { ApQueueJob, JobStatus, QueueName } from '@activepieces/server-shared'

export type ConsumerManager = {
    init(): Promise<void>
    poll<T extends QueueName>(queueName: T, opts: Options): Promise<Omit<ApQueueJob, 'engineToken'> | null>
    update(params: UpdateParams): Promise<void>
    close(): Promise<void>
}

type Options = {
    token: string
}

type UpdateParams = {
    jobId: string
    queueName: QueueName
    status: JobStatus
    token: string
    message: string
}