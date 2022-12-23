import fastify from 'fastify';
import { User } from 'shared';
import { databaseModule } from './database/database-module';
import { authenticationModule } from './authentication/authentication.module';
import {collectionModule} from "./collection/collection.module";
import {collectionController} from "./collection/collection.controller";

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

const start = async () => {
    try {
        await app.listen({ port: 3000 });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

start();
