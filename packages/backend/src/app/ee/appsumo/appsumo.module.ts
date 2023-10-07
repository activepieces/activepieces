import { FastifyInstance, FastifyRequest } from 'fastify'
import { Static, Type } from '@sinclair/typebox'
import { plansService } from '../billing/plans/plan.service'
import { userService } from '../../user/user-service'
import { projectService } from '../../project/project-service'
import { StatusCodes } from 'http-status-codes'
import { isNil } from 'lodash'
import { appsumoService } from './appsumo.service'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { PlanType, defaultPlanInformation } from '../billing/plans/pricing-plans'

export const appSumoModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(appsumoController, { prefix: '/v1/appsumo' })
}

const exchangeCredentialUsername = system.get(SystemProp.APPSUMO_TOKEN)
const exchangeCredentialPassword = system.get(SystemProp.APPSUMO_TOKEN)
const token = system.get(SystemProp.APPSUMO_TOKEN)

const ActionRequest = Type.Object({
    action: Type.String(),
    plan_id: Type.String(),
    uuid: Type.String(),
    activation_email: Type.String(),
})

type ActionRequest = Static<typeof ActionRequest>

const ExchangeTokenRequest = Type.Object({
    username: Type.String(),
    password: Type.String(),
})
type ExchangeTokenRequest = Static<typeof ExchangeTokenRequest>

const AuthorizationHeaders = Type.Object({
    authorization: Type.String(),
})
type AuthorizationHeaders = Static<typeof AuthorizationHeaders>

const appsumoController: FastifyPluginAsyncTypebox = async (fastify: FastifyInstance) => {
    fastify.post(
        '/token',
        {
            schema: {
                body: ExchangeTokenRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Body: ExchangeTokenRequest
            }>,
            reply,
        ) => {
            if (
                request.body.username === exchangeCredentialUsername &&
                request.body.password === exchangeCredentialPassword
            ) {
                return reply.status(StatusCodes.OK).send({
                    access: token,
                })
            }
            else {
                return reply.status(StatusCodes.UNAUTHORIZED).send()
            }
        },
    )

    fastify.post(
        '/action',
        {
            schema: {
                headers: AuthorizationHeaders,
                body: ActionRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Headers: AuthorizationHeaders
                Body: ActionRequest
            }>,
            reply,
        ) => {
            if (request.headers.authorization != `Bearer ${token}`) {
                return reply.status(StatusCodes.UNAUTHORIZED).send()
            }
            else {
                const { plan_id, activation_email, action, uuid } = request.body
                const appSumoPlan = appsumoService.getPlanInformation(plan_id)
                const user = await userService.getOneByEmail({
                    email: activation_email,
                })
                if (!isNil(user)) {
                    const project = (await projectService.getUserProject(user.id))
                    const plan = await plansService.getOrCreateDefaultPlan({
                        projectId: project.id,
                    })
                    if (action === 'refund') {
                        await plansService.update({
                            projectPlanId: plan.id,
                            subscription: null,
                            planLimits: defaultPlanInformation[PlanType.FLOWS],
                        })
                    }
                    else {
                        await plansService.update({
                            projectPlanId: plan.id,
                            subscription: null,
                            planLimits: appSumoPlan,
                        })
                    }
                }
                else {
                    if (action === 'refund') {
                        await appsumoService.delete(uuid)
                    }
                    else {
                        await appsumoService.upsert({
                            uuid,
                            plan_id,
                            activation_email,
                        })
                    }
                }
                switch (action) {
                    case 'activate':
                        return reply.status(StatusCodes.CREATED).send({
                            redirect_url:
                                'https://cloud.activepieces.com/sign-up?email=' +
                                encodeURIComponent(activation_email),
                            message: 'success',
                        })
                    default:
                        return reply.status(StatusCodes.OK).send({
                            message: 'success',
                        })
                }
            }
        },
    )
}
