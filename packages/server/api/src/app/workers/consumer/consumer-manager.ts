import { JobStatus, QueueName } from '@activepieces/server-shared'
import { JobData } from 'server-worker'

export type ConsumerManager = {
    init(): Promise<void>
    poll<T extends QueueName>(queueName: T, token: string): Promise<JobData | undefined>
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