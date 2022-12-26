import fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Principal, User } from 'shared';
import { databaseModule } from './database/database-module';
import { authenticationModule } from './authentication/authentication.module';
import {collectionModule} from "./collections/collection.module";
import {StatusCodes} from "http-status-codes";
import {ActivepiecesError} from "./helper/activepieces-error";
import {projectModule} from "./project/project.module";
import {flowModule} from "./flows/flow.module";
import {fileModule} from "./file/file.module";
import {redisClient} from "./database/redis-connection";
import {piecesController} from "./pieces/pieces.controller";

declare module 'fastify' {
    export interface FastifyRequest {
        principal: Principal;
    }
}

const app = fastify({
    logger: true
});

app.register(databaseModule);
app.register(authenticationModule);
app.register(projectModule);
app.register(piecesController);
app.register(collectionModule);
app.register(fileModule);
app.register(flowModule);

app.setErrorHandler(function (error, request, reply) {
    if (error instanceof ActivepiecesError) {
        let apError = error as ActivepiecesError;
        reply.status(StatusCodes.BAD_REQUEST).send({
            code: apError.error.code
        })
    }else {
        reply.status(error.statusCode).send(error)
    }
})

const start = async () => {
    try {
        await redisClient.connect();
        await app.listen({ port: 3000 });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

start();