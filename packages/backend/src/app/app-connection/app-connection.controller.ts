import { FastifyInstance, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { AppConnectionId, ListAppConnectionRequest, UpsertConnectionRequest } from "@activepieces/shared";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { appConnectionService } from "./app-connection.service";

const DEFAULT_PAGE_SIZE = 10;
export const appConnectionController = async (fastify: FastifyInstance) => {

    fastify.post(
        "/",
        {
            schema: {
                body: UpsertConnectionRequest
            }
        },
        async (
            request: FastifyRequest<{
                Body: UpsertConnectionRequest;
            }>
        ) => {
            const connection = await appConnectionService.upsert({ projectId: request.principal.projectId, request: request.body });
            // Remove sensitive data from response
            delete connection.value['client_secret'];
            delete connection.value['refresh_token'];
            return connection;
        }
    );


    fastify.get(
        "/:connectionName",
        async (
            request: FastifyRequest<{
                Params: {
                    connectionName: string;
                };
            }>
        ) => {
            const appCredential = await appConnectionService.getOne({ projectId: request.principal.projectId, name: request.params.connectionName });
            if (appCredential === null) {
                throw new ActivepiecesError({
                    code: ErrorCode.APP_CONNECTION_NOT_FOUND,
                    params: { id: request.params.connectionName },
                });
            }
            // Remove sensitive data from response
            delete appCredential.value['client_secret'];
            delete appCredential.value['refresh_token'];
            return appCredential;
        }
    );

    fastify.get(
        "/",
        {
            schema: {
                querystring: ListAppConnectionRequest
            },
        },
        async (
            request: FastifyRequest<{
                Querystring: ListAppConnectionRequest;
            }>
        ) => {
            const query = request.query;
            return await appConnectionService.list(request.principal.projectId,
                query.appName,
                query.cursor ?? null, query.limit ?? DEFAULT_PAGE_SIZE);
        }
    );

    fastify.delete(
        "/:connectionId",
        async (
            request: FastifyRequest<{
                Params: {
                    connectionId: AppConnectionId;
                };
            }>,
            _reply
        ) => {
            await appConnectionService.delete({ id: request.params.connectionId, projectId: request.principal.projectId });
            _reply.status(StatusCodes.OK).send();
        }
    );
};
