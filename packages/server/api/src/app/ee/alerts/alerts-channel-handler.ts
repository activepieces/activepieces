import { Alert, AlertChannel, AlertEvent } from "@activepieces/ee-shared"
import { emailService } from "../helper/email/email-service"
import { FastifyBaseLogger } from "fastify"

type ChannelHandler = {
  send: (alert: Alert, event: AlertEvent, payload: unknown) => Promise<void>
}

const emailChannel = (log: FastifyBaseLogger): ChannelHandler => ({
  send: async (alert: Alert, event: AlertEvent, payload: unknown) => {
    await emailService(log).sendAlert(alert, event, payload)
  }
})


export const channelHandler: Record<AlertChannel, (log: FastifyBaseLogger) => ChannelHandler> = {
  [AlertChannel.EMAIL]: emailChannel
}
