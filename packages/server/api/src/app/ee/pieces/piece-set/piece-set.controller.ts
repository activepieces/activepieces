import { AssignProjectsRequestBody, CreatePieceSetRequestBody, DuplicatePieceSetRequestBody, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdatePieceSetRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { pieceSetService } from './piece-set.service'

const platformAdminSecurity = securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE])

export const pieceSetController: FastifyPluginAsyncZod = async (app) => {
    const service = pieceSetService(app.log)

    app.get('/', ListPieceSets, async (req) => {
        return service.list({
            platformId: req.principal.platform.id,
            cursor: req.query.cursor,
            limit: req.query.limit,
        })
    })

    app.post('/', CreatePieceSet, async (req, reply) => {
        const set = await service.create({
            platformId: req.principal.platform.id,
            ...req.body,
        })
        return reply.status(StatusCodes.CREATED).send(set)
    })

    app.get('/:id', GetPieceSet, async (req) => {
        return service.getOne({ id: req.params.id, platformId: req.principal.platform.id })
    })

    app.post('/:id', UpdatePieceSet, async (req) => {
        return service.update({
            id: req.params.id,
            platformId: req.principal.platform.id,
            request: req.body,
        })
    })

    app.delete('/:id', DeletePieceSet, async (req, reply) => {
        await service.delete({ id: req.params.id, platformId: req.principal.platform.id })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.post('/:id/duplicate', DuplicatePieceSet, async (req, reply) => {
        const clone = await service.duplicate({ id: req.params.id, platformId: req.principal.platform.id, name: req.body.name })
        return reply.status(StatusCodes.CREATED).send(clone)
    })

    app.post('/:id/projects', AssignProjects, async (req, reply) => {
        await service.assignProjects({
            pieceSetId: req.params.id,
            platformId: req.principal.platform.id,
            projectIds: req.body.projectIds,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.delete('/:id/projects/:projectId', RemoveProjectAssignment, async (req, reply) => {
        await service.removeProjectAssignment({
            pieceSetId: req.params.id,
            platformId: req.principal.platform.id,
            projectId: req.params.projectId,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const idParam = z.object({ id: z.string() })

const ListPieceSets = {
    config: { security: platformAdminSecurity },
    schema: {
        tags: ['piece-sets'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        summary: 'List piece sets for the platform',
        querystring: z.object({
            cursor: z.string().optional(),
            limit: z.coerce.number().int().min(1).max(100).optional().default(10),
        }),
    },
}

const CreatePieceSet = {
    config: { security: platformAdminSecurity },
    schema: {
        tags: ['piece-sets'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        summary: 'Create a piece set',
        body: CreatePieceSetRequestBody,
        response: { [StatusCodes.CREATED]: z.unknown() },
    },
}

const GetPieceSet = {
    config: { security: platformAdminSecurity },
    schema: {
        tags: ['piece-sets'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        summary: 'Get a piece set by id',
        params: idParam,
    },
}

const UpdatePieceSet = {
    config: { security: platformAdminSecurity },
    schema: {
        tags: ['piece-sets'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        summary: 'Update a piece set',
        params: idParam,
        body: UpdatePieceSetRequestBody,
    },
}

const DeletePieceSet = {
    config: { security: platformAdminSecurity },
    schema: {
        tags: ['piece-sets'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        summary: 'Delete a piece set',
        params: idParam,
        response: { [StatusCodes.NO_CONTENT]: z.undefined() },
    },
}

const DuplicatePieceSet = {
    config: { security: platformAdminSecurity },
    schema: {
        tags: ['piece-sets'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        summary: 'Duplicate a piece set',
        params: idParam,
        body: DuplicatePieceSetRequestBody,
        response: { [StatusCodes.CREATED]: z.unknown() },
    },
}

const AssignProjects = {
    config: { security: platformAdminSecurity },
    schema: {
        tags: ['piece-sets'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        summary: 'Assign projects to a piece set',
        params: idParam,
        body: AssignProjectsRequestBody,
        response: { [StatusCodes.NO_CONTENT]: z.undefined() },
    },
}

const RemoveProjectAssignment = {
    config: { security: platformAdminSecurity },
    schema: {
        tags: ['piece-sets'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        summary: 'Remove a project from a piece set',
        params: z.object({ id: z.string(), projectId: z.string() }),
        response: { [StatusCodes.NO_CONTENT]: z.undefined() },
    },
}
