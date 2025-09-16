import { ApSemaphore, QueueName } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, isNil, JobData } from '@activepieces/shared'
import cronParser from 'cron-parser'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { jobConsumer } from '../consumer/job-consumer'

export type ApJob<T> = {
    data: T
    id: string
    cronExpression?: string
    cronTimezone?: string
    nextFireAtEpochSeconds?: number
    failureCount?: number
}

export class ApMemoryQueue<T extends JobData> {
    private queue: ApJob<T>[]
    private lock: ApSemaphore
    private isConsuming = false
    private log: FastifyBaseLogger
    private queueName: QueueName
    private consumer: ReturnType<typeof jobConsumer>

    constructor(log: FastifyBaseLogger, queueName: QueueName) {
        this.lock = new ApSemaphore(1)
        this.queue = []
        this.log = log
        this.queueName = queueName
        this.consumer = jobConsumer(log)
    }

    add(job: ApJob<T>): void {
        if (isRecurringJob(job)) {
            this.queue.push(calculateNextJob(job))
        }
        else {
            this.queue.push(job)
        }
        this.startConsuming().catch((error) => {
            this.log.error({
                message: 'Error starting consuming',
                error,
            })
        })
    }

    async remove(id: string): Promise<void> {
        await this.lock.acquire()
        this.queue = this.queue.filter((job) => job.id !== id)
        this.lock.release()
    }

    async poll(): Promise<ApJob<T> | undefined> {
        try {
            await this.lock.acquire()
            const jobToRun = this.queue.findIndex((job) => isNil(job.nextFireAtEpochSeconds) || dayjs().unix() >= Number(job.nextFireAtEpochSeconds))
            if (jobToRun === -1) {
                return undefined
            }
            const currentJob = this.queue.splice(jobToRun, 1)[0]
            if (isRecurringJob(currentJob)) {
                this.queue.push(calculateNextJob(currentJob))
            }
            return currentJob
        }
        finally {
            this.lock.release()
        }
    }

    private async startConsuming(): Promise<void> {
        if (this.isConsuming) {
            return
        }
        
        this.isConsuming = true
        
        while (this.isConsuming) {
            let currentJob: ApJob<T> | undefined
            try {
                currentJob = await this.poll()
                if (!currentJob) {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    continue
                }

                await this.consumer.consume(
                    currentJob.id,
                    this.queueName,
                    currentJob.data,
                    0,
                )

                this.log.info({
                    message: 'Successfully consumed job from memory queue',
                    jobId: currentJob.id,
                    queueName: this.queueName,
                })
            }
            catch (error) {
                this.log.error({
                    message: 'Error consuming job from memory queue',
                    jobId: currentJob?.id,
                    queueName: this.queueName,
                    error: error instanceof Error ? error.message : String(error),
                })
            
            }
        }
    }

    async stopConsuming(): Promise<void> {
        this.isConsuming = false
    }
}

function isRecurringJob<T>(job: ApJob<T>): boolean {
    return job.cronExpression !== undefined
}

function calculateNextJob<T>(job: ApJob<T>): ApJob<T> {
    assertNotNullOrUndefined(job.cronExpression, 'cronExpression')
    const nextFireAtEpochSeconds = calculateNextFireForCron(job.cronExpression, 'UTC')
    return {
        ...job,
        nextFireAtEpochSeconds,
    }
}

function calculateNextFireForCron(cronExpression: string, timezone: string): number {
    const interval = cronParser.parseExpression(cronExpression, {
        tz: timezone,
    })
    return dayjs(interval.next().getTime()).unix()
}