import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { PersonalProjectsSummary, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { platformService } from '../../../platform/platform.service'
import { platformMustHaveFeatureEnabled } from '../../authentication/ee-authorization'
import { personalProjectsService } from './personal-projects.service'

export const personalProjectsModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(personalProjectsController, { prefix: '/v1/personal-projects' })
}

const personalProjectsController: FastifyPluginAsyncZod = async (app) => {
    app.get('/summary', SummaryRequest, async (request, reply) => {
        await platformMustHaveFeatureEnabled((platform) => platform.plan.projectRolesEnabled).call(app, request, reply)
        return personalProjectsService(request.log).summary({ platformId: request.principal.platform.id })
    })

    app.post('/create-missing', CreateMissingRequest, async (request, reply) => {
        await platformMustHaveFeatureEnabled((platform) => platform.plan.projectRolesEnabled).call(app, request, reply)
        const platform = await platformService(request.log).getOneOrThrow(request.principal.platform.id)
        if (!platform.autoCreatePersonalProjects) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Turn on personal projects before creating them for existing members',
                },
            })
        }
        await personalProjectsService(request.log).scheduleCreateMissing({ platformId: platform.id })
        await reply.status(StatusCodes.ACCEPTED).send()
    })
}

const SummaryRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        response: {
            [StatusCodes.OK]: PersonalProjectsSummary,
        },
    },
}

const CreateMissingRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        response: {
            [StatusCodes.ACCEPTED]: z.never(),
        },
    },
}
