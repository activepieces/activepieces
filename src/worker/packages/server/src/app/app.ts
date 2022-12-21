import Fastify from 'fastify';
import { userController } from '../controller/user.controller';

const fastify = Fastify({
    logger: true
});

fastify.register(userController);

const start = async () => {
    try {
        await fastify.listen({ port: 3000 });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();
