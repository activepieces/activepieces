import { FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { gitRepoService } from './git-repo.service'
import { PrincipalType, SeekPage } from '@activepieces/shared'
import { CreateRepoRequest as ConfigureRepoRequest, GitRepo, PullRepoRequest, PushGitRepoRequest } from '@activepieces/ee-shared'
import { StatusCodes } from 'http-status-codes'


export const gitRepoController: FastifyPluginCallbackTypebox = (app, _options, done): void => {

    app.post('/', ConfigureRepoRequestSchema, async (request) => {
        return gitRepoService.upsert(request.body)
    })

    app.get('/', ListRepoRequestSchema, async (request) => {
        return gitRepoService.list(request.query)
    })

    app.post('/push', PushRepoRequestSchema, async (request) => {
        await gitRepoService.push(request.body)
    })

    app.post('/pull', PullRepoRequestSchema, async (request) => {
        await gitRepoService.pull(request.body)
    })

    done()
}

const PullRepoRequestSchema = {
    config: {
        allowedPrincipals: [PrincipalType.SERVICE, PrincipalType.USER],
    },
    schema: {
        tags: ['git-repo'],
        description: 'Pull all changes from the git repository and overwrite any conflicting changes in the project.',
        body: PullRepoRequest,
        response: {
            [StatusCodes.NO_CONTENT]: Type.Undefined(),
        },
    },
}

const PushRepoRequestSchema = {
    config: {
        allowedPrincipals: [PrincipalType.SERVICE, PrincipalType.USER],
    },
    schema: {
        tags: ['git-repo'],
        description: 'Push all changes from the project and overwrite any conflicting changes in the git repository.',
        body: PushGitRepoRequest,
        response: {
            [StatusCodes.NO_CONTENT]: Type.Undefined(),
        },
    },
}

const ConfigureRepoRequestSchema = {
    config: {
        allowedPrincipals: [PrincipalType.SERVICE, PrincipalType.USER],
    },
    schema: {
        tags: ['git-repo'],
        description: 'Configure a git repository for a project.',
        body: ConfigureRepoRequest,
        response: {
            [StatusCodes.OK]: SeekPage(GitRepo),
        },
    },
}

const ListRepoRequestSchema = {
    config: {
        allowedPrincipals: [PrincipalType.SERVICE, PrincipalType.USER],
    },
    schema: {
        tags: ['git-repo'],
        querystring: Type.Object({
            projectId: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: SeekPage(GitRepo),
        },
    },
}