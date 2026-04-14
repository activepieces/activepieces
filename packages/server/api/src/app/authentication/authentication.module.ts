import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { authenticationController } from './authentication.controller'
import auth from './better-auth/auth'

export const authenticationModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(authenticationController, {
        prefix: '/v1/authentication',
    })

    app.route({
        method: ['GET', 'POST'],
        url: '/v1/better-auth/*',
        async handler(request, reply) {
            try {
                const url = new URL(request.url, `http://${request.headers.host}`)

                const headers = new Headers()
                Object.entries(request.headers).forEach(([key, value]) => {
                    if (value) headers.append(key, value.toString())
                })
                app.log.info({ headers, headers2: request.headers }, '[authModule]')
                const req = new Request(url.toString(), {
                    method: request.method,
                    headers,
                    body: request.body ? JSON.stringify(request.body) : undefined,
                })

                const response = await auth.handler(req)

                void reply.status(response.status)
                response.headers.forEach((value, key) => {
                    void reply.header(key, value)
                })
                void reply.send(response.body ? await response.text() : null)

            }
            catch (error) {
                void reply.status(500).send({
                    error: 'Internal authentication error',
                    code: 'AUTH_FAILURE',
                })
            }
        },
    })

}
