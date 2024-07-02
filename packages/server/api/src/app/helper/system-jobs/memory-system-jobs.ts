import { logger } from '@activepieces/server-shared'
import dayjs from 'dayjs'
import cron from 'node-cron'
import { SystemJobSchedule } from './common'
import { getJobHandler } from './job-handlers'

const scheduled: Record<string, boolean> = {}

export const memorySystemJobSchedulerService: SystemJobSchedule = {
    async init(): Promise<void> {
        //
    },
    async upsertJob({ job, schedule }): Promise<void> {
        if (scheduled[job.name]) {
            return
        }
        const jobHandler = getJobHandler(job.name)
        switch (schedule.type) {
            case 'one-time': {
                const diff = schedule.date.diff(dayjs(), 'milliseconds')
                if (diff > 0) {
                    setTimeout(() => {
                        jobHandler(job.data).catch(logger.error)
                    }, diff)
                }
                break
            }
            case 'repeated': {
                const cronExpression = schedule.cron
                cron.schedule(cronExpression, () => {
                    jobHandler(job.data).catch(logger.error)
                })
                break
            }
        }
        scheduled[job.name] = true
    },
    async close(): Promise<void> {
        //
    },
}
