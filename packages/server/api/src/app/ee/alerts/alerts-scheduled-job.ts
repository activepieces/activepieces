import { FastifyBaseLogger } from "fastify";
import { SystemJobData, SystemJobName } from "../../helper/system-jobs/common";
import { systemJobsSchedule } from "../../helper/system-jobs/system-job";
import { systemJobHandlers } from "../../helper/system-jobs/job-handlers";
import { redisConnections } from "../../database/redis-connections";
import { alertEventKey } from "./alerts-handler";
import { isNil } from "@activepieces/shared";
import { Alert, AlertEvent, ApplicationEventName } from "@activepieces/ee-shared";
import { emailService } from "../helper/email/email-service";

export const alertsScheduledJob = (log: FastifyBaseLogger) => ({

    async init(): Promise<void> {
      systemJobHandlers.registerJobHandler(SystemJobName.ALERT_SUMMARY, this.consumeAlertSummaryJob)
    },

    upsertAlertSummaryJob: async (alert: Alert): Promise<void> => {
        await systemJobsSchedule(log).upsertJob({
            job: {
                jobId: `alert-summary-${alert.id}`,
                name: SystemJobName.ALERT_SUMMARY,
                data: { alert },
            },
            schedule: {
                type: 'repeated',
                cron: '*/30 * * * * *',
            },
        })
    },

    consumeAlertSummaryJob: async (jobData: SystemJobData<SystemJobName.ALERT_SUMMARY>): Promise<void> => {
          const redisConnection = await redisConnections.useExisting()
          const alertEventsKeys = await redisConnection.keys(alertEventKey(jobData.alert.id, "*"))
          if (isNil(alertEventsKeys) || alertEventsKeys.length === 0) {
            return
          }
          const values = await redisConnection.mget(alertEventsKeys)
          const parsedRecords = parseRedisRecords(alertEventsKeys, values)

          await emailService(log).sendAlertSummary(jobData.alert, parsedRecords)
    }
})

export type AlertSummaryEventStats = {
  event: AlertEvent
  count: number
}

const parseRedisRecords = (redisKeys: string[], values: (string | null)[]): AlertSummaryEventStats[] => {
  return redisKeys.map((key, index) => {
      const parts = key.split(':')
      return {
          event: parts[2] as ApplicationEventName,
          count: Number(values[index]) || 0
      }
  })
}