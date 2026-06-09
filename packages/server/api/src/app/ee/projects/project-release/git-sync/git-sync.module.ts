import {
    ConfigureRepoRequest,
    GitRepoWithoutSensitiveData,
    Permission,
    PrincipalType, PushGitRepoRequest, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsync } from 'fastify'
import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { entitiesMustBeOwnedByCurrentProject } from '../../../../authentication/authorization'
import { ProjectResourceType } from '../../../../core/security/authorization/common'
import { securityAccess } from '../../../../core/security/authorization/fastify-security'
import { platformMustHaveFeatureEnabled } from '../../../authentication/ee-authorization'
import { GitRepoEntity } from './git-sync.entity'
import { gitRepoService } from './git-sync.service'

export const gitRepoModule: FastifyPluginAsync = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.environmentsEnabled))
    await app.register(gitRepoController, { prefix: '/v1/git-repos' })
}

export const gitRepoController: FastifyPluginCallbackZod = (
    app,
    _options,
    done,
): void => {


    app.post('/', ConfigureRepoRequestSchema, async (request, reply) => {
        const gitSync = await gitRepoService(request.log).upsert(request.body)
        await reply
            .status(StatusCodes.CREATED)
            .send(gitSync)
    })

    app.get('/', ListRepoRequestSchema, async (request) => {
        return gitRepoService(request.log).list(request.query)
    })

    app.post('/:id/push', PushRepoRequestSchema, async (request) => {
        return gitRepoService(request.log).push({
            id: request.params.id,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            request: request.body,
            log: request.log,
        })
    })

    app.delete('/:id', DeleteRepoRequestSchema, async (request, reply) => {
        await gitRepoService(request.log).delete({
            id: request.params.id,
            projectId: request.projectId,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    })

    done()
}


const DeleteRepoRequestSchema = {
    config: {
        security: securityAccess.project([PrincipalType.USER], Permission.WRITE_PROJECT_RELEASE, {
            type: ProjectResourceType.TABLE,
            tableName: GitRepoEntity,
        }),
    },
    schema: {
        description: 'Delete a git repository information for a project.',
        params: z.object({
            id: z.string(),
        }),
        response: {
            [StatusCodes.NO_CONTENT]: z.never(),
        },
    },
}


const PushRepoRequestSchema = {
    config: {
        security: securityAccess.project([PrincipalType.USER], Permission.WRITE_PROJECT_RELEASE, {
            type: ProjectResourceType.TABLE,
            tableName: GitRepoEntity,
        }),
    },
    schema: {
        description:
            'Push single flow to the git repository',
        body: PushGitRepoRequest,
        params: z.object({
            id: z.string(),
        }),
        response: {
            [StatusCodes.OK]: z.never(),
        },
    },
}

const ConfigureRepoRequestSchema = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.SERVICE], Permission.WRITE_PROJECT_RELEASE, {
            type: ProjectResourceType.BODY,
        }),
    },
    schema: {
        tags: ['git-repos'],
        description: 'Upsert a git repository information for a project.',
        body: ConfigureRepoRequest,
        response: {
            [StatusCodes.CREATED]: GitRepoWithoutSensitiveData,
        },
    },
}

const ListRepoRequestSchema = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.SERVICE], Permission.READ_PROJECT_RELEASE, {
            type: ProjectResourceType.QUERY,
        }),
    },
    schema: {
        querystring: z.object({
            projectId: z.string(),
        }),
        response: {
            [StatusCodes.OK]: SeekPage(GitRepoWithoutSensitiveData),
        },
    },
}
