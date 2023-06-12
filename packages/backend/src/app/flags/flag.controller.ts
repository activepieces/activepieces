import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { flagService } from './flag.service'

export const flagController = async (app: FastifyInstance) => {

    app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
        const rawToken = _request.headers.authorization
        const isAuthenticated = !(rawToken === undefined || rawToken === null)
        const flags = await flagService.getAll(isAuthenticated)
        const flagMap: Record<string, unknown> = {}
        flags.forEach(flag => {
            flagMap[flag.id as string] = flag.value
        })
        reply.send(flagMap)
    })
}
