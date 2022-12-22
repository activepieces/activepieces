import fastify from 'fastify';
import { User } from 'shared';
import { authenticationModule } from './authentication/authentication.module';

declare module 'fastify' {
    export interface FastifyRequest {
        user: User;
    }
}

const app = fastify({
    logger: true
});

app.register(authenticationModule);

const start = async () => {
    try {
        await app.listen({ port: 3000 });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

start();