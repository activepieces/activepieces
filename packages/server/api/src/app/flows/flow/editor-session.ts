import { AsyncLocalStorage } from 'node:async_hooks'
import { ApId } from '@activepieces/core-utils'
import { EDITOR_SESSION_ID_HEADER } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'

const actor = new AsyncLocalStorage<string>()

export const editorSession = {
    idFromRequest(request: FastifyRequest): string | null {
        const parsed = ApId.safeParse(request.headers[EDITOR_SESSION_ID_HEADER])
        return parsed.success ? parsed.data : null
    },
    run<T>({ id, fn }: { id: string, fn: () => T }): T {
        return actor.run(id, fn)
    },
    current(): string | null {
        return actor.getStore() ?? null
    },
}
