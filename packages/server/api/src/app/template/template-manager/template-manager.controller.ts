import { securityAccess } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, ErrorCode, PrincipalType, SetStatusTemplateRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Static, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../helper/system/system'
import { templateManagerService } from './template-manager.service'

const edition = system.getEdition()

export const templateManagerController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/:id/view', ViewParams, async (request, reply) => {
        if (edition !== ApEdition.CLOUD) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Template manager is only available for cloud edition',
                },
            })
        }
        await templateManagerService(app.log).view(request.params.id)
        return reply.status(StatusCodes.OK).send()
    })

    app.post('/:id/install', InstallParams, async (request, reply) => {
        if (edition !== ApEdition.CLOUD) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Template manager is only available for cloud edition',
                },
            })
        }
        await templateManagerService(app.log).install(request.params.id, { userId: request.principal.id })
        return reply.status(StatusCodes.OK).send()
    })
    
    app.post('/:id/status', SetStatusParams, async (request, reply) => {
        if (edition !== ApEdition.CLOUD) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Template manager is only available for cloud edition',
                },
            })
        }
        await templateManagerService(app.log).setStatus(request.params.id, { flowId: request.body.flowId, status: request.body.status })
        return reply.status(StatusCodes.OK).send()
    })
    
    app.post('/click-explore-button', ClickExploreButtonParams, async (request, reply) => {
        if (edition !== ApEdition.CLOUD) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Template manager is only available for cloud edition',
                },
            })
        }
        await templateManagerService(app.log).clickExploreButton()
        return reply.status(StatusCodes.OK).send()
    })
}


const GetIdParams = Type.Object({
    id: Type.String(),
})
type GetIdParams = Static<typeof GetIdParams>

const ViewParams = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        params: GetIdParams,
    },
}

const InstallParams = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        params: GetIdParams,
    },
}

const SetStatusParams = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        params: GetIdParams,
        body: SetStatusTemplateRequestBody,
    },
}

const ClickExploreButtonParams = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
}