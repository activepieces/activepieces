import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { piecesReportController } from './pieces-report.controller'

export const piecesReportModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(piecesReportController, { prefix: '/v1/platform' })
}
