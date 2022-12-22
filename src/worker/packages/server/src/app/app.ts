import Fastify from 'fastify';
import { userController } from '../controller/user.controller';
import {componentsController} from "../controller/components.controller";
import {ActivepiecesError} from "../helper/activepieces-error";
import {StatusCodes} from "http-status-codes";

const fastify = Fastify({
    logger: true
});

fastify.register(userController);
fastify.register(componentsController);

fastify.setErrorHandler(function (error, request, reply) {
    if (error instanceof ActivepiecesError) {
        let apError = error as ActivepiecesError;
        reply.status(StatusCodes.BAD_REQUEST).send({
            code: apError.error.code
        })
    }
    reply.status(error.statusCode).send(error)
})

const start = async () => {
    try {
        await fastify.listen({ port: 3000 });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();
