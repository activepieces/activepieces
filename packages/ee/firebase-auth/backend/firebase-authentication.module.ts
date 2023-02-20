import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { firebaseAuthenticationController } from "./firebase-authentication.controller";

export const firebaseAuthenticationModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.register(firebaseAuthenticationController, { prefix: "/v1/firebase" });
};

