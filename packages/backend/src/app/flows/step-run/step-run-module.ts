import { FastifyPluginAsync } from 'fastify'
import { stepRunController } from './step-run-controller'

export const stepRunModule: FastifyPluginAsync = async (app) => {
    app.register(stepRunController, { prefix: '/v1/step-run' })
}
