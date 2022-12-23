import fastify from 'fastify';
import { User } from 'shared';
import { databaseModule } from './database/database-module';
import { authenticationModule } from './authentication/authentication.module';
import {collectionModule} from "./collection/collection.module";
import {collectionController} from "./collection/collection.controller";
import {StatusCodes} from "http-status-codes";
import {ActivepiecesError} from "./helper/activepieces-error";

declare module 'fastify' {
    export interface FastifyRequest {
        user: User;
    }
}

const app = fastify({
    logger: true
});


app.register(collectionController);
app.register(databaseModule);
app.register(collectionModule);
app.register(authenticationModule);

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
        await app.listen({ port: 3000 });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

start();
