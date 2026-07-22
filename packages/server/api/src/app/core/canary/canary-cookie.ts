import { isNil } from '@activepieces/core-utils'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

// Signing/parsing/verification are delegated to @fastify/cookie (see .agents/features/canary.md).
export const canaryCookie = {
    // Header form (not reply.setCookie): the canary response is streamed by @fastify/reply-from.
    buildSetHeader(app: FastifyInstance): string {
        return app.serializeCookie(CANARY_COOKIE_NAME, app.signCookie(CANARY_COOKIE_VALUE), CANARY_COOKIE_OPTIONS)
    },
    clear(reply: FastifyReply): void {
        void reply.clearCookie(CANARY_COOKIE_NAME, { path: '/' })
    },
    isPresent(request: FastifyRequest): boolean {
        return !isNil(request.cookies[CANARY_COOKIE_NAME])
    },
    isValidHeader(app: FastifyInstance, cookieHeader: string | undefined): boolean {
        if (isNil(cookieHeader)) {
            return false
        }
        const raw = app.parseCookie(cookieHeader)[CANARY_COOKIE_NAME]
        if (isNil(raw)) {
            return false
        }
        const { valid, value } = app.unsignCookie(raw)
        return valid && value === CANARY_COOKIE_VALUE
    },
}

export const CANARY_COOKIE_NAME = 'ap_canary'
const CANARY_COOKIE_VALUE = '1'
// Deliberately NOT HttpOnly — the frontend reads its presence to swap bundles. Safe: signed +
// no privilege. See .agents/features/canary.md § Security model before changing these options.
const CANARY_COOKIE_OPTIONS = {
    path: '/',
    maxAge: 60 * 60 * 24,
    secure: true,
    sameSite: 'lax',
} as const
