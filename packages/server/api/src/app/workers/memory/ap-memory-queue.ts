import { ApSemaphore } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, isNil } from '@activepieces/shared'
// import cronParser from 'cron-parser'
import dayjs from 'dayjs'

export type ApJob<T> = {
    data: T
    id: string
    cronExpression?: string
    cronTimezone?: string
    nextFireAtEpochSeconds?: number
    failureCount?: number
}

export class ApMemoryQueue<T> {
    private queue: ApJob<T>[]
    private lock: ApSemaphore
    constructor() {
        this.lock = new ApSemaphore(1)
        this.queue = []
    }

    add(job: ApJob<T>): void {
        if (isRecurringJob(job)) {
            this.queue.push(calculateNextJob(job))
        }
        else {
            this.queue.push(job)
        }
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
    // Temporary fallback until cron-parser is installed
    // const interval = cronParser.parseExpression(cronExpression, {
    //     tz: timezone,
    // })
    // return dayjs(interval.next().getTime()).unix()
    
    // Simple fallback - run every hour
    return dayjs().add(1, 'hour').unix()
}