import { logger } from 'server-shared'
import { SystemJobSchedule } from './common'
import dayjs from 'dayjs'
import cron from 'node-cron'

export const memorySystemJobSchedulerService: SystemJobSchedule = {
    async init(): Promise<void> {
        //
    },
    async upsertJob({ job, schedule, handler }): Promise<void> {
        switch (schedule.type) {
            case 'one-time': {
                const diff = schedule.date.diff(dayjs(), 'milliseconds')
                if (diff > 0) {
                    setTimeout(() => {
                        handler(job.data).catch(logger.error)
                    }, diff)
                }
                break
            }
            case 'repeated': {
                const cronExpression = schedule.cron
                cron.schedule(cronExpression, () => {
                    handler(job.data).catch(logger.error)
                })
                break
            }
        }
    },
    async close(): Promise<void> {
        //
    },
}