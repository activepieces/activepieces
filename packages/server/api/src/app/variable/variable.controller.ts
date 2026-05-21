import {
    ApId,
    AppConnectionOwners,
    ApplicationEventName,
    ListVariablesRequestQuery,
    Permission,
    PrincipalType,
    RevealVariableResponse,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpdateVariableRequestBody,
    UpsertVariableRequestBody,
    VariableWithoutSensitiveData,
} from '@activepieces/shared'
import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { applicationEvents } from '../helper/application-events'
import { securityHelper } from '../helper/security-helper'
import { VariableEntity } from './variable.entity'
import { variableService } from './variable.service'

export const variableController: FastifyPluginCallbackZod = (app, _opts, done) => {
    app.post('/', CreateVariableRequest, async (request, reply) => {
        const ownerId = await securityHelper.getUserIdFromRequest(request)
        const variable = await variableService(request.log).create({
            projectId: request.projectId,
            platformId: request.principal.platform.id,
            name: request.body.name,
            value: request.body.value,
            metadata: request.body.metadata,
            ownerId,
        })
        applicationEvents(request.log).sendUserEvent(request, {
            action: ApplicationEventName.VARIABLE_UPSERTED,
            data: { variable: { id: variable.id, name: variable.name, created: variable.created, updated: variable.updated } },
        })
        await reply.status(StatusCodes.CREATED).send(variable)
    })

    app.post('/:id', UpdateVariableRequest, async (request, reply) => {
        const variable = await variableService(request.log).update({
            id: request.params.id,
            projectId: request.projectId,
            platformId: request.principal.platform.id,
            value: request.body.value,
            metadata: request.body.metadata,
        })
        applicationEvents(request.log).sendUserEvent(request, {
            action: ApplicationEventName.VARIABLE_UPSERTED,
            data: { variable: { id: variable.id, name: variable.name, created: variable.created, updated: variable.updated } },
        })
        await reply.status(StatusCodes.OK).send(variable)
    })

    app.get('/', ListVariablesRequest, async (request): Promise<SeekPage<VariableWithoutSensitiveData>> => {
        return variableService(request.log).list({
            projectId: request.projectId,
            platformId: request.principal.platform.id,
            cursor: request.query.cursor,
            limit: request.query.limit,
            name: request.query.name,
        })
    })

    app.get('/owners', ListVariableOwnersRequest, async (request): Promise<SeekPage<AppConnectionOwners>> => {
        const owners = await variableService(request.log).getOwners({
            projectId: request.projectId,
            platformId: request.principal.platform.id,
        })
        return { data: owners, next: null, previous: null }
    })

    app.post('/:id/reveal', RevealVariableRequest, async (request) => {
        const variable = await variableService(request.log).getOneOrThrowWithoutValue({
            id: request.params.id,
            projectId: request.projectId,
            platformId: request.principal.platform.id,
        })
        const value = await variableService(request.log).getDecryptedValue({
            id: request.params.id,
            projectId: request.projectId,
            platformId: request.principal.platform.id,
        })
        applicationEvents(request.log).sendUserEvent(request, {
            action: ApplicationEventName.VARIABLE_VALUE_REVEALED,
            data: { variable: { id: variable.id, name: variable.name, created: variable.created, updated: variable.updated } },
        })
        return { value }
    })

    app.delete('/:id', DeleteVariableRequest, async (request, reply): Promise<void> => {
        const variable = await variableService(request.log).delete({
            id: request.params.id,
            projectId: request.projectId,
            platformId: request.principal.platform.id,
        })
        applicationEvents(request.log).sendUserEvent(request, {
            action: ApplicationEventName.VARIABLE_DELETED,
            data: { variable: { id: variable.id, name: variable.name, created: variable.created, updated: variable.updated } },
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    })

    done()
}

const CreateVariableRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.WRITE_VARIABLE,
            { type: ProjectResourceType.BODY },
        ),
    },
    schema: {
        tags: ['variables'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Create a project variable. Fails if a variable with the same name already exists.',
        body: UpsertVariableRequestBody,
        response: {
            [StatusCodes.CREATED]: VariableWithoutSensitiveData,
        },
    },
}

const UpdateVariableRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.WRITE_VARIABLE,
            { type: ProjectResourceType.TABLE, tableName: VariableEntity },
        ),
    },
    schema: {
        tags: ['variables'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Update a project variable value or metadata. Name cannot be changed.',
        params: z.object({ id: ApId }),
        body: UpdateVariableRequestBody,
        response: {
            [StatusCodes.OK]: VariableWithoutSensitiveData,
        },
    },
}

const ListVariablesRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.READ_VARIABLE,
            { type: ProjectResourceType.QUERY },
        ),
    },
    schema: {
        tags: ['variables'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListVariablesRequestQuery,
        description: 'List project variables',
        response: {
            [StatusCodes.OK]: SeekPage(VariableWithoutSensitiveData),
        },
    },
}

const ListVariableOwnersRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.READ_VARIABLE,
            { type: ProjectResourceType.QUERY },
        ),
    },
    schema: {
        tags: ['variables'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: z.object({ projectId: z.string() }),
        description: 'List users who own at least one variable in the project',
        response: {
            [StatusCodes.OK]: SeekPage(z.object({
                firstName: z.string(),
                lastName: z.string(),
                email: z.string(),
            })),
        },
    },
}

const RevealVariableRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            Permission.WRITE_VARIABLE,
            { type: ProjectResourceType.TABLE, tableName: VariableEntity },
        ),
    },
    schema: {
        tags: ['variables'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Reveal a variable plaintext value',
        params: z.object({ id: ApId }),
        response: {
            [StatusCodes.OK]: RevealVariableResponse,
        },
    },
}

const DeleteVariableRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.WRITE_VARIABLE,
            { type: ProjectResourceType.TABLE, tableName: VariableEntity },
        ),
    },
    schema: {
        tags: ['variables'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Delete a project variable',
        params: z.object({ id: ApId }),
        response: {
            [StatusCodes.NO_CONTENT]: z.never(),
        },
    },
}

