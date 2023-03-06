import { FastifyInstance } from "fastify";
import { collectionController } from "./collection.controller";

export const collectionModule = async (app: FastifyInstance) => {
    app.register(collectionController, { prefix: "/v1/collections" });
};
