import { isObject } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'

export const requestUtils = {
    extractProjectId(request: FastifyRequest): string | undefined {
        if (isObject(request.body) && 'projectId' in request.body) {
            return request.body.projectId as string
        }
        else if (isObject(request.query) && 'projectId' in request.query) {
            return request.query.projectId as string
        }

        return undefined
    },
}
