import { JobData } from '@activepieces/shared'
import { Job } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'

export enum InterceptorVerdict {
    ALLOW = 'ALLOW',
    REJECT = 'REJECT',
}

export type InterceptorResult =
    | { verdict: InterceptorVerdict.ALLOW }
    | { verdict: InterceptorVerdict.REJECT, delayInMs: number, priority?: number }

export type JobInterceptor = {
    preDispatch(params: { jobId: string, jobData: JobData, job: Job, log: FastifyBaseLogger }): Promise<InterceptorResult>
    onJobFinished(params: { jobId: string, jobData: JobData, log: FastifyBaseLogger }): Promise<void>
}
