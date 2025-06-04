import {
    ConfigureRepoRequest,
    GitRepoWithoutSensitiveData,
    PushGitRepoRequest,
} from '@activepieces/ee-shared'
import { Permission, PrincipalType, SeekPage } from '@activepieces/shared'
import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { FastifyPluginAsync } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../../../authentication/authorization'
import { platformMustHaveFeatureEnabled } from '../../../authentication/ee-authorization'
import { gitRepoService } from './git-sync.service'

export const gitRepoModule: FastifyPluginAsync = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.environmentsEnabled))
    await app.register(gitRepoController, { prefix: '/v1/git-repos' })
}

export const gitRepoController: FastifyPluginCallbackTypebox = (
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
            projectId: request.principal.projectId,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    })

    done()
}


const DeleteRepoRequestSchema = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permission: Permission.WRITE_PROJECT_RELEASE,
    },
    schema: {
        description: 'Delete a git repository information for a project.',
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Never(),
        },
    },
}


const PushRepoRequestSchema = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permission: Permission.WRITE_PROJECT_RELEASE,
    },
    schema: {
        description:
            'Push single flow to the git repository',
        body: PushGitRepoRequest,
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: Type.Never(),
        },
    },
}

const ConfigureRepoRequestSchema = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.WRITE_PROJECT_RELEASE,
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
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.READ_PROJECT_RELEASE,
    },
    schema: {
        querystring: Type.Object({
            projectId: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: SeekPage(GitRepoWithoutSensitiveData),
        },
    },
}
