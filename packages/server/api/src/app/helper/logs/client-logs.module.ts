import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { clientLogsController } from './client-logs.controller'

// Dev-only ingest for browser debug logs. Registration is gated in app.ts behind
// LOG_FILE=true and a non-cloud edition, so it is never exposed in production.
export const clientLogsModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(clientLogsController, { prefix: '/v1/logs' })
}
