import { ApId } from '@activepieces/core-utils'
import { EDITOR_SESSION_ID_HEADER } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'

export const editorSession = {
    idFromRequest(request: FastifyRequest): string | null {
        const parsed = ApId.safeParse(request.headers[EDITOR_SESSION_ID_HEADER])
        return parsed.success ? parsed.data : null
    },
}
