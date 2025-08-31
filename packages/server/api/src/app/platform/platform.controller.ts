import {
    ApId,
    assertEqual,
    EndpointScope,
    PlatformWithoutSensitiveData,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpdatePlatformRequestBody,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser } from '../ee/authentication/ee-authorization'
import { smtpEmailSender } from '../ee/helper/email/email-sender/smtp-email-sender'
import { platformService } from './platform.service'

export const platformController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/:id', UpdatePlatformRequest, async (req, res) => {
        await platformMustBeOwnedByCurrentUser.call(app, req, res)

        const { smtp } = req.body
        if (smtp) {
            await smtpEmailSender(req.log).validateOrThrow(smtp)
        }

        await platformService.update({
            id: req.params.id,
            ...req.body,
        })
        return platformService.getOneWithPlanAndUsageOrThrow(req.params.id)
    })

    app.get('/:id', GetPlatformRequest, async (req) => {
        assertEqual(
            req.principal.platform.id,
            req.params.id,
            'userPlatformId',
            'paramId',
        )
        return platformService.getOneWithPlanAndUsageOrThrow(req.params.id)
    })
}

const UpdatePlatformRequest = {
    schema: {
        body: UpdatePlatformRequestBody,
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: PlatformWithoutSensitiveData,
        },
    },
}

const GetPlatformRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['platforms'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Get a platform by id',
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: PlatformWithoutSensitiveData,
        },
    },
}
