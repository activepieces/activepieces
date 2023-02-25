import { webhookService } from "@backend/webhooks/webhook-service";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { appEventRoutingService } from "./app-event-routing.service";

export const appConnectionModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.register(appConnectionController, { prefix: "/v1/app-events" });
};

export const appConnectionController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {

    fastify.post(
        "/:appName",
        async (
            request: FastifyRequest<{
                Body: unknown;
                Params: {
                    appName: string;
                }
            }>,
            _reply
        ) => {
            const appName = request.params.appName;
            // TODO
            const eventName = "";
            const identifierValue = "";
            const event = request.body;
            const listeners = await appEventRoutingService.listListeners({appName, event: eventName, identifierValue});
            listeners.forEach(listener => {
                webhookService.callback({
                    flowId: listener.flowId,
                    payload: {
                        headers: request.headers,
                        body: request.body,
                        queryParams: request.query
                    },
                });
            });
        }
    );

}