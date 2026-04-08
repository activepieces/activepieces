import { CreateFieldRequest, Field, ListFieldsRequestQuery, PrincipalType, UpdateFieldRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { EntitySourceType, ProjectResourceType } from '../../core/security/authorization/common'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { TableEntity } from '../table/table.entity'
import { FieldEntity } from './field.entity'
import { fieldService } from './field.service'

export const fieldController: FastifyPluginAsyncZod = async (fastify) => {

    fastify.post('/', CreateRequest, async (request, reply) => {
        const response = await fieldService.create({ request: request.body, projectId: request.projectId })
        await reply.status(StatusCodes.CREATED).send(response)
    },
    )

    fastify.get('/', GetFieldsRequest, async (request) => {
        return fieldService.getAll({
            projectId: request.projectId,
            tableId: request.query.tableId,
        })
    },
    )

    fastify.get('/:id', GetFieldByIdRequest, (request) => {
        return fieldService.getById({
            id: request.params.id,
            projectId: request.projectId,
        })
    },
    )

    fastify.delete('/:id', DeleteFieldRequest, async (request) => {
        return fieldService.delete({
            id: request.params.id,
            projectId: request.projectId,
        })
    },
    )

    fastify.post('/:id', UpdateRequest, async (request) => {
        return fieldService.update({
            id: request.params.id,
            projectId: request.projectId,
            request: request.body,
        })
    },
    )
}
const CreateRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE, PrincipalType.SERVICE], undefined, {
            type: ProjectResourceType.TABLE,
            tableName: TableEntity,
            entitySourceType: EntitySourceType.BODY,
            lookup: {
                paramKey: 'tableId',
                entityField: 'id',
            },
        }),
    },
    schema: {
        body: CreateFieldRequest,
    },
    response: {
        [StatusCodes.CREATED]: Field,
    },
}

const GetFieldByIdRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE, PrincipalType.SERVICE], undefined, {
            type: ProjectResourceType.TABLE,
            tableName: FieldEntity,
        }),
    },
    schema: {
        params: z.object({
            id: z.string(),
        }),
    },
}

const DeleteFieldRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE, PrincipalType.SERVICE], undefined, {
            type: ProjectResourceType.TABLE,
            tableName: FieldEntity,
        }),
    },
    schema: {
        params: z.object({
            id: z.string(),
        }),
    },
}

const GetFieldsRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE, PrincipalType.SERVICE], undefined, {
            type: ProjectResourceType.TABLE,
            tableName: TableEntity,
            entitySourceType: EntitySourceType.QUERY,
            lookup: {
                paramKey: 'tableId',
                entityField: 'id',
            },
        }),
    },
    schema: {
        querystring: ListFieldsRequestQuery,
    },
}

const UpdateRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE, PrincipalType.SERVICE], undefined, {
            type: ProjectResourceType.TABLE,
            tableName: FieldEntity,
        }),
    },
    schema: {
        params: z.object({
            id: z.string(),
        }),
        body: UpdateFieldRequest,
    },
}
