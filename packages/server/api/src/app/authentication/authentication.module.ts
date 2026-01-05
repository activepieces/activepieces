import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { authenticationController } from './authentication.controller'
import auth from './better-auth/auth';

export const authenticationModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(authenticationController, {
        prefix: '/v1/authentication',
    })

    app.route({
        method: ["GET", "POST"],
        url: "/v1/better-auth/*",
        async handler(request, reply) {
          try {
            const url = new URL(request.url, `http://${request.headers.host}`);
            
            const headers = new Headers();
            Object.entries(request.headers).forEach(([key, value]) => {
              if (value) headers.append(key, value.toString());
            });
      
            const req = new Request(url.toString(), {
              method: request.method,
              headers,
              body: request.body ? JSON.stringify(request.body) : undefined,
            });
            
            const response = await auth.handler(req);

            reply.status(response.status);
            response.headers.forEach((value, key) => reply.header(key, value));
            reply.send(response.body ? await response.text() : null);
      
          } catch (error) {
            reply.status(500).send({ 
              error: "Internal authentication error",
              code: "AUTH_FAILURE"
            });
          }
        }
      });

}
