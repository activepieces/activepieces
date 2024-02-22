import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { gitRepoService } from './git-repo.service'
import { PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, SeekPage } from '@activepieces/shared'
import {
    ConfigureRepoRequest,
    GitRepoWithoutSenestiveData,
    PushGitRepoRequest,
} from '@activepieces/ee-shared'
import { StatusCodes } from 'http-status-codes'

export const gitRepoController: FastifyPluginCallbackTypebox = (
    app,
    _options,
    done,
): void => {
    app.post('/', ConfigureRepoRequestSchema, async (request, reply) => {
        await reply
            .status(StatusCodes.CREATED)
            .send(await gitRepoService.upsert(request.body))
    })

    app.get('/', ListRepoRequestSchema, async (request) => {
        return gitRepoService.list(request.query)
    })

    app.post('/:id/push', PushRepoRequestSchema, async (request) => {
        await gitRepoService.push({
            id: request.params.id,
            userId: request.principal.id,
            request: request.body,
        })
    })

    app.post('/:id/pull', PullRepoRequestSchema, async (request) => {
        await gitRepoService.pull({
            id: request.params.id,
        })
    })

    app.delete('/:id', DeleteRepoRequestSchema, async (request, reply) => {
        await gitRepoService.delete({
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
    },
    schema: {
        description: 'Delete a git repository information for a project.',
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Undefined(),
        },
    },
}

const PullRepoRequestSchema = {
    config: {
        allowedPrincipals: [PrincipalType.SERVICE, PrincipalType.USER],
    },
    schema: {
        description:
      'Pull all changes from the git repository and overwrite any conflicting changes in the project.',
        params: Type.Object({
            id: Type.String(),
        }),
        tags: ['git-repo'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.NO_CONTENT]: Type.Undefined(),
        },
    },
}

const PushRepoRequestSchema = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        description:
      'Push all changes from the project and overwrite any conflicting changes in the git repository.',
        body: PushGitRepoRequest,
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Undefined(),
        },
    },
}

const ConfigureRepoRequestSchema = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        description: 'Upsert a git repository information for a project.',
        body: ConfigureRepoRequest,
        response: {
            [StatusCodes.CREATED]: GitRepoWithoutSenestiveData,
        },
    },
}

const ListRepoRequestSchema = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        querystring: Type.Object({
            projectId: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: SeekPage(GitRepoWithoutSenestiveData),
        },
    },
}
