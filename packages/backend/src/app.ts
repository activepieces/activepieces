import fastify from "fastify";
import cors from "@fastify/cors";
import { databaseModule } from "./database/database-module";
import { authenticationModule } from "./authentication/authentication.module";
import { collectionModule } from "./collections/collection.module";
import { projectModule } from "./project/project.module";
import { flowModule } from "./flows/flow.module";
import { fileModule } from "./file/file.module";
import { piecesController } from "./pieces/pieces.controller";
import { oauth2Module } from "./oauth2/oauth2.module";
import { tokenVerifyMiddleware } from "./authentication/token-verify-middleware";
import { storeEntryModule } from "./store-entry/store-entry.module";
import { instanceModule } from "./instance/instance-module";
import { flowRunModule } from "./flow-run/flow-run-module";
import { flagModule } from "./flags/flag.module";
import { codeModule } from "./workers/code-worker/code.module";
import { flowWorkerModule } from "./workers/flow-worker/flow-worker-module";
import { webhookModule } from "./webhooks/webhook-module";
import { errorHandler } from "./helper/error-handler";

const app = fastify({
  logger: true,
});
app.register(cors, {
  origin: "*",
  methods: ["*"]
});
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

app.setErrorHandler(errorHandler);

const start = async () => {
  try {
    await app.listen({
      host: "0.0.0.0",
      port: 3000,
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
