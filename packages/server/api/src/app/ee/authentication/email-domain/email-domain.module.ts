import { ApId } from '@activepieces/core-utils'
import { AddEmailDomainRequest, EmailDomain, EmailDomainWithUsage, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import cron from 'node-cron'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { networkUtils } from '../../../helper/network-utils'
import { rejectedPromiseHandler } from '../../../helper/promise-handler'
import { platformMustHaveFeatureEnabled } from '../ee-authorization'
import { emailDomainService } from './email-domain.service'

export const emailDomainModule: FastifyPluginAsyncZod = async (app) => {
    cron.schedule('0 * * * *', () => {
        rejectedPromiseHandler(emailDomainService(app.log).expirePending(), app.log)
    })
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.ssoEnabled))
    await app.register(emailDomainController, { prefix: '/v1/email-domains' })
}

const emailDomainController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListRequest, async (req) => {
        return emailDomainService(req.log).list({ platformId: req.principal.platform.id })
    })

    app.post('/', AddRequest, async (req, res) => {
        const emailDomain = await emailDomainService(req.log).add({
            platformId: req.principal.platform.id,
            domain: req.body.domain,
            userId: req.principal.id,
            ip: networkUtils.clientIp(req),
        })
        return res.status(StatusCodes.CREATED).send(emailDomain)
    })

    app.post('/:id/verify', VerifyRequest, async (req) => {
        return emailDomainService(req.log).verify({
            platformId: req.principal.platform.id,
            id: req.params.id,
            userId: req.principal.id,
            ip: networkUtils.clientIp(req),
        })
    })

    app.delete('/:id', RemoveRequest, async (req, res) => {
        await emailDomainService(req.log).remove({
            platformId: req.principal.platform.id,
            id: req.params.id,
            userId: req.principal.id,
            ip: networkUtils.clientIp(req),
        })
        return res.status(StatusCodes.OK).send()
    })
}

const ListRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        response: {
            [StatusCodes.OK]: z.array(EmailDomainWithUsage),
        },
    },
}

const AddRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        body: AddEmailDomainRequest,
        response: {
            [StatusCodes.CREATED]: EmailDomain,
        },
    },
}

const VerifyRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        params: z.object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: EmailDomain,
        },
    },
}

const RemoveRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        params: z.object({
            id: ApId,
        }),
    },
}
