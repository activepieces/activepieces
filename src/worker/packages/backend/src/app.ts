import fastify from 'fastify';
import {apId, Principal, PrincipalType} from 'shared';
import {databaseModule} from './database/database-module';
import {authenticationModule} from './authentication/authentication.module';
import {collectionModule} from "./collections/collection.module";
import {StatusCodes} from "http-status-codes";
import {ActivepiecesError} from "./helper/activepieces-error";
import {projectModule} from "./project/project.module";
import {flowModule} from "./flows/flow.module";
import {fileModule} from "./file/file.module";
import {piecesController} from "./pieces/pieces.controller";
import {oauth2Module} from "./oauth2/oauth2.module";
import {tokenVerifyMiddleware} from "./authentication/token-verify-middleware";
import {storeEntryModule} from "./store-entry/store-entry.module";
import {instanceModule} from './instance/instance-module';
import {instanceRunModule} from './instance-run/instance-run-module';
import {flagModule} from "./flags/flag.module";
import { codeModule } from './workers/code-worker/code.module';
import { flowWorkerModule } from './workers/flow-worker/flow-worker.module';

declare module 'fastify' {
    export interface FastifyRequest {
        principal: Principal;
    }
}

const app = fastify({
    logger: true
});
app.addHook('onRequest', tokenVerifyMiddleware);
app.register(databaseModule);
app.register(authenticationModule);
app.register(projectModule);
app.register(collectionModule);
app.register(fileModule);
app.register(flagModule);
app.register(storeEntryModule);
app.register(flowModule);
app.register(codeModule);
app.register(flowWorkerModule);
app.register(piecesController);
app.register(oauth2Module);
app.register(instanceModule);
app.register(instanceRunModule);

app.setErrorHandler(function (error, request, reply) {
    if (error instanceof ActivepiecesError) {
        let apError = error as ActivepiecesError;
        reply.status(StatusCodes.BAD_REQUEST).send({
            code: apError.error.code
        })
    }else {
        reply.status(error.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR).send(error)
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