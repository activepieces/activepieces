import { ALL_PRINCIPAL_TYPES, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { userService } from '../user/user-service'
import { changelogService } from './changelog.service'

export const changelogController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListChangelogsRequest, async (request) => {
        return changelogService(request.log).list()
    })
    app.post('/dismiss', DismissChangelogRequest, async (request) => {
        const { date } = request.body
        const user = await userService.getOrThrow({ id: request.principal.id })
        return userService.update({
            id: user.id,
            platformId: request.principal.platform.id,
            lastChangelogDismissed: date,
        })
    })

}

const ListChangelogsRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
}

const DismissChangelogRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        body: Type.Object({
            date: Type.String(),
        }),
    },
}