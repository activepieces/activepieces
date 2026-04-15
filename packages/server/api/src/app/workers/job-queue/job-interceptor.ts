import { JobData } from '@activepieces/shared'
import { Job } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'

export enum InterceptorVerdict {
    ALLOW = 'ALLOW',
    REJECT = 'REJECT',
    DISCARD = 'DISCARD',
}

export type InterceptorResult =
    | { verdict: InterceptorVerdict.ALLOW }
    | { verdict: InterceptorVerdict.REJECT, delayInMs: number, priority?: number }
    | { verdict: InterceptorVerdict.DISCARD }

export type JobInterceptor = {
    preDispatch(params: { jobId: string, jobData: JobData, job: Job, log: FastifyBaseLogger }): Promise<InterceptorResult>
    onJobFinished(params: { jobId: string, jobData: JobData, failed: boolean, log: FastifyBaseLogger }): Promise<void>
}
