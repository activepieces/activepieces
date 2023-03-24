import { FastifyInstance } from "fastify";
import { appConnectionController } from "./app-connection.controller";

export const appConnectionModule = async (app: FastifyInstance) => {
    app.register(appConnectionController, { prefix: "/v1/app-connections" });
};
