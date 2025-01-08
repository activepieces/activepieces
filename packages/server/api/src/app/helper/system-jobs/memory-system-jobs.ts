import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import cron from 'node-cron'
import { SystemJobSchedule } from './common'
import { systemJobHandlers } from './job-handlers'

const scheduled: Record<string, boolean> = {}

export const memorySystemJobSchedulerService = (log: FastifyBaseLogger): SystemJobSchedule => ({
    async init(): Promise<void> {
        //
    },
    async upsertJob({ job, schedule }): Promise<void> {
        if (scheduled[job.name]) {
            return
        }
        const jobHandler = systemJobHandlers.getJobHandler(job.name)
        switch (schedule.type) {
            case 'one-time': {
                const diff = schedule.date.diff(dayjs(), 'milliseconds')
                if (diff > 0) {
                    setTimeout(() => {
                        jobHandler(job.data).catch(log.error)
                    }, diff)
                }
                break
            }
            case 'repeated': {
                const cronExpression = schedule.cron
                cron.schedule(cronExpression, () => {
                    jobHandler(job.data).catch(log.error)
                })
                break
            }
        }
        scheduled[job.name] = true
    },
    async close(): Promise<void> {
        //
    },
})
