import { EDITOR_SESSION_ID_HEADER } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'

export const editorSession = {
    idFromRequest(request: FastifyRequest): string | null {
        const header = request.headers[EDITOR_SESSION_ID_HEADER]
        return typeof header === 'string' ? header : null
    },
}
