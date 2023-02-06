import dayjs from 'dayjs';
import fastify, { FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import formBody from "@fastify/formbody";
import qs from 'qs';
import { databaseModule } from "./app/database/database.module";
import { authenticationModule } from "./app/authentication/authentication.module";
import { collectionModule } from "./app/collections/collection.module";
import { projectModule } from "./app/project/project.module";
import { flowModule } from "./app/flows/flow.module";
import { fileModule } from "./app/file/file.module";
import { piecesController } from "./app/pieces/pieces.controller";
import { oauth2Module } from "./app/oauth2/oauth2.module";
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
import { system } from "./app/helper/system/system";
import { SystemProp } from "./app/helper/system/system-prop";
import { databaseConnection } from "./app/database/database-connection";

const envToLogger = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        colorize: true,
        ignore: 'pid,hostname'
      },
    }
  },
  production: true
}

const app = fastify({
  // TODO we need variable to switch to production mode.
  logger: envToLogger['development'],
  ajv: {
    customOptions: {
      removeAdditional: 'all',
      useDefaults: true,
      coerceTypes: true,
    }
  }
});

export const logger = app.log;

app.register(cors, {
  origin: "*",
  methods: ["*"]
});
app.register(formBody, { parser: str => qs.parse(str) });
app.addHook("onRequest", tokenVerifyMiddleware);
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
app.register(flowRunModule);
app.register(webhookModule);
app.register(appConnectionModule);

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
    } else {
      reply.type('text/html').send(`<script>if(window.opener){window.opener.postMessage({ 'code': '${params['code']}' },'*')}</script> <html>Redirect succuesfully, this window should close now</html>`)
    }
  }
);
app.setErrorHandler(errorHandler);

const start = async () => {
  try {
    await app.listen({
      host: "0.0.0.0",
      port: 3000,
    });
    await databaseConnection.runMigrations();

    console.log(`
             _____   _______   _____  __      __  ______   _____    _____   ______    _____   ______    _____
    /\\      / ____| |__   __| |_   _| \\ \\    / / |  ____| |  __ \\  |_   _| |  ____|  / ____| |  ____|  / ____|
   /  \\    | |         | |      | |    \\ \\  / /  | |__    | |__) |   | |   | |__    | |      | |__    | (___
  / /\\ \\   | |         | |      | |     \\ \\/ /   |  __|   |  ___/    | |   |  __|   | |      |  __|    \\___ \\
 / ____ \\  | |____     | |     _| |_     \\  /    | |____  | |       _| |_  | |____  | |____  | |____   ____) |
/_/    \\_\\  \\_____|    |_|    |_____|     \\/     |______| |_|      |_____| |______|  \\_____| |______| |_____/

started on ${system.get(SystemProp.FRONTEND_URL)}
    `);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
