import fastify, { FastifyRequest, HTTPMethods } from "fastify";
import cors from "@fastify/cors";
import formBody from "@fastify/formbody";
import qs from 'qs';
import { authenticationModule } from "./app/authentication/authentication.module";
import { collectionModule } from "./app/collections/collection.module";
import { projectModule } from "./app/project/project.module";
import { openapiModule } from "./app/helper/openapi/openapi.module";
import { flowModule } from "./app/flows/flow.module";
import { fileModule } from "./app/file/file.module";
import { piecesController } from "./app/pieces/pieces.controller";
import { tokenVerifyMiddleware } from "./app/authentication/token-verify-middleware";
import { storeEntryModule } from "./app/store-entry/store-entry.module";
import { instanceModule } from "./app/instance/instance.module";
import { flowRunModule } from "./app/flow-run/flow-run-module";
import { flagModule } from "./app/flags/flag.module";
import { codeModule } from "./app/workers/code-worker/code.module";
import { flowWorkerModule } from "./app/workers/flow-worker/flow-worker-module";
import { webhookModule } from "./app/webhooks/webhook-module";
import { errorHandler } from "./app/helper/error-handler";
import { appConnectionModule } from "./app/app-connection/app-connection.module";
import { system, validateEnvPropsOnStartup } from "./app/helper/system/system";
import { SystemProp } from "./app/helper/system/system-prop";
import swagger from "@fastify/swagger";
import { databaseConnection } from "./app/database/database-connection";
import { initilizeSentry, logger } from './app/helper/logger';
import { firebaseAuthenticationModule } from "@ee/firebase-auth/backend/firebase-authentication.module";
import { billingModule } from "@ee/billing/backend/billing.module";
import { getEdition } from "./app/helper/secret-helper";
import { ApEdition } from "@activepieces/shared";
import { appEventRoutingModule } from "./app/app-event-routing/app-event-routing.module";
import { appCredentialModule } from "@ee/product-embed/backend/app-credentials/app-credentials.module";
import { connectionKeyModule } from "@ee/product-embed/backend/connection-keys/connection-key.module";

const app = fastify({
    logger,
    ajv: {
        customOptions: {
            removeAdditional: 'all',
            useDefaults: true,
            coerceTypes: true,
            formats: {

            }
        }
    }
});

app.register(swagger, {
    openapi: {
        info: {
            title: 'Activepieces Documentation',
            version: "0.3.6",
        },
        externalDocs: {
            url: 'https://www.activepieces.com/docs',
            description: 'Find more info here'
        },
    }
});

app.register(cors, {
    origin: "*",
    methods: ["*"]
});
app.register(import('fastify-raw-body'), {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
    routes: []
});
app.register(formBody, { parser: str => qs.parse(str) });

app.addHook("onRequest", async (request, reply) => {
    const route = app.hasRoute({
        method: request.method as HTTPMethods,
        url: request.url,
    });
    if (!route) {
        reply.code(404).send(`Oops! It looks like we hit a dead end. The endpoint you're searching for is nowhere to be found. We suggest turning around and trying another path. Good luck!`);
    } 
});

app.addHook("onRequest", tokenVerifyMiddleware);
app.register(projectModule);
app.register(collectionModule);
app.register(fileModule);
app.register(flagModule);
app.register(storeEntryModule);
app.register(flowModule);
app.register(codeModule);
app.register(flowWorkerModule);
app.register(piecesController);
app.register(instanceModule);
app.register(flowRunModule);
app.register(webhookModule);
app.register(appConnectionModule);
app.register(openapiModule);
app.register(appEventRoutingModule);

app.get(
    "/redirect",
    async (
        request: FastifyRequest<{ Querystring: { code: string; } }>, reply
    ) => {
        const params = {
            "code": request.query.code
        };
        if (params.code === undefined) {
            reply.send("The code is missing in url");
        }
        else {
            reply.type('text/html').send(`<script>if(window.opener){window.opener.postMessage({ 'code': '${encodeURIComponent(params['code'])}' },'*')}</script> <html>Redirect succuesfully, this window should close now</html>`)
        }
    }
);
app.setErrorHandler(errorHandler);

const start = async () => {
    try {

        await validateEnvPropsOnStartup();
        await databaseConnection.initialize();
        await databaseConnection.runMigrations();
            
        const edition = await getEdition();
        logger.info("Activepieces " + (edition == ApEdition.ENTERPRISE ? 'Enterprise' : 'Community') + " Edition");
        if (edition === ApEdition.ENTERPRISE) {
            app.register(firebaseAuthenticationModule);
            app.register(billingModule);
            app.register(appCredentialModule);
            app.register(connectionKeyModule);
            initilizeSentry();
        }
        else {
            app.register(authenticationModule);
        }
        await app.listen({
            host: "0.0.0.0",
            port: 3000,
        });

        console.log(`
             _____   _______   _____  __      __  ______   _____    _____   ______    _____   ______    _____
    /\\      / ____| |__   __| |_   _| \\ \\    / / |  ____| |  __ \\  |_   _| |  ____|  / ____| |  ____|  / ____|
   /  \\    | |         | |      | |    \\ \\  / /  | |__    | |__) |   | |   | |__    | |      | |__    | (___
  / /\\ \\   | |         | |      | |     \\ \\/ /   |  __|   |  ___/    | |   |  __|   | |      |  __|    \\___ \\
 / ____ \\  | |____     | |     _| |_     \\  /    | |____  | |       _| |_  | |____  | |____  | |____   ____) |
/_/    \\_\\  \\_____|    |_|    |_____|     \\/     |______| |_|      |_____| |______|  \\_____| |______| |_____/

started on ${system.get(SystemProp.FRONTEND_URL)}
    `);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
