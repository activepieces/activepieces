import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { turnstile } from './lib/turnstile'
import { passwordlessAuthController } from './passwordless-auth.controller'

export const passwordlessAuthModule: FastifyPluginAsyncZod = async (app) => {
    if (!turnstile.isConfigured()) {
        app.log.error('[passwordlessAuthModule] signing in with an emailed code stays off: it needs a captcha, so set AP_TURNSTILE_SITE_KEY and AP_TURNSTILE_SECRET_KEY to switch it on')
        return
    }
    await app.register(passwordlessAuthController, {
        prefix: '/v1/authentication',
    })
}
