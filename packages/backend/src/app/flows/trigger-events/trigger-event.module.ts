import { FastifyInstance, FastifyRequest } from "fastify";
import { ListTriggerEventsRequest } from "@activepieces/shared";
import { triggerEventService } from "./trigger-event.service";
import { flowService } from "../flow.service";

const DEFUALT_PAGE_SIZE = 10;

export const triggerEventModule = async (app: FastifyInstance) => {
    app.register(triggerEventController, { prefix: "/v1/trigger-events" });
};


const triggerEventController = async (fastify: FastifyInstance) => {

    fastify.get(
        "/",
        {
            schema: {
                querystring: ListTriggerEventsRequest
            },
        },
        async (
            request: FastifyRequest<{
                Querystring: ListTriggerEventsRequest;
            }>
        ) => {
            const flow = await flowService.getOneOrThrow({projectId: request.principal.projectId, id: request.query.flowId});
            return await triggerEventService.list({
                projectId: request.principal.projectId,
                flowVersion: flow.version,
                cursor: request.query.cursor ?? null,
                limit: request.query.limit ?? DEFUALT_PAGE_SIZE
            });
        }
    );


};
