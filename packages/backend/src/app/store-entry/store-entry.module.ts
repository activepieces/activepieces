import { FastifyInstance } from "fastify";

import { storeEntryController } from "./store-entry.controller";

export const storeEntryModule = async (app: FastifyInstance) => {
    app.register(storeEntryController, { prefix: "/v1/store-entries" });
};
