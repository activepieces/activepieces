import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { flagService } from './flag.service'
import { isNil } from 'lodash'
import { PrincipalType } from '@activepieces/shared'

export const flagController = async (app: FastifyInstance) => {
    app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const isAuthenticated = request.principal.type === PrincipalType.USER;
        const flags = await flagService.getAll(isAuthenticated)
        const flagMap: Record<string, unknown> = {}
        flags.forEach(flag => {
            flagMap[flag.id as string] = flag.value
        })
        reply.send(flagMap)
    })
}
