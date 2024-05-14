import { exceptionHandler, rejectedPromiseHandler } from '@activepieces/server-shared'
import cronParser from 'cron-parser'
import dayjs from 'dayjs'

export type ApJob<T> = {
    data: T
    id: string
    cronExpression?: string
    cronTimezone?: string
    nextFireAtEpochSeconds?: number
}

export class ApMemoryQueue<T> {
    private queue: ApJob<T>[]

    constructor() {
        this.queue = []
    }

    add(job: ApJob<T>): void {
        const nextJob = calculateNextJob(job)
        if (nextJob) {
            this.queue.push(nextJob)
        }
        else {
            this.queue.push(job)
        }

    }

    remove(jobId: string): void {
        this.queue = this.queue.filter((j) => j.id !== jobId)
    }

    start(processJob: (job: ApJob<T>) => Promise<void>): void {
        setInterval(() => {
            const jobsToRun = this.queue.filter((job) => {
                if (job.nextFireAtEpochSeconds) {
                    return dayjs().unix() >= Number(job.nextFireAtEpochSeconds)
                }
                return true
            })
            this.queue = this.queue.filter((job) => !jobsToRun.includes(job))

            for (const job of jobsToRun) {
                rejectedPromiseHandler(processJob(job))
                const nextJob = calculateNextJob(job)
                if (nextJob) {
                    this.queue.push(nextJob)
                }
            }
        }, 50)
    }
}

function calculateNextJob<T>(job: ApJob<T>): ApJob<T> | null {
    if (job.cronExpression) {
        const nextFireAtEpochSeconds = calculateNextFireForCron(job.cronExpression, 'UTC')
        if (nextFireAtEpochSeconds) {
            return {
                ...job,
                nextFireAtEpochSeconds,
            }
        }
    }
    return null
}


function calculateNextFireForCron(cronExpression: string, timezone: string): number | null {
    try {
        const interval = cronParser.parseExpression(cronExpression, {
            tz: timezone,
        })
        return dayjs(interval.next().getTime()).unix()
    }
    catch (e) {
        exceptionHandler.handle(e)
        return null
    }

}