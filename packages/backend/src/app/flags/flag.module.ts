import { FastifyInstance } from "fastify";
import { flagController } from "./flag.controller";

export const flagModule = async (app: FastifyInstance) => {
    app.register(flagController, { prefix: "/v1/flags" });
};
