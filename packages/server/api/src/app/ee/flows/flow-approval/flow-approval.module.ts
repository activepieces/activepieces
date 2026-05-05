import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformMustHaveFeatureEnabled } from '../../authentication/ee-authorization'
import { flowApprovalRequestController } from './flow-approval-request.controller'

export const flowApprovalModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.flowApprovalEnabled))
    await app.register(flowApprovalRequestController, { prefix: '/v1/flow-approval-requests' })
}
