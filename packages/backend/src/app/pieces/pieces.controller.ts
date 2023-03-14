import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { GetPieceRequestParams, GetPieceRequestQuery, PieceOptionRequest } from "@activepieces/shared";
import { pieces } from "@activepieces/pieces-apps";
import { engineHelper } from "../helper/engine-helper";
import { pieceMetadataLoader } from "./piece-metadata-loader";

export const piecesController: FastifyPluginAsync = async (app) => {
    app.get("/v1/pieces", async () => {
        return pieces.map(p => p.metadata());
    });

    app.post(
        "/v1/pieces/:pieceName/options",
        {
            schema: {
                body: PieceOptionRequest
            },
        },
        async (
            request: FastifyRequest<{
                Params: { pieceName: string };
                Body: PieceOptionRequest;
            }>,
        ) => {
            return engineHelper.executeProp({
                pieceName: request.params.pieceName,
                pieceVersion: request.body.pieceVersion,
                propertyName: request.body.propertyName,
                stepName: request.body.stepName,
                input: request.body.input,
                collectionId: request.body.collectionId,
                projectId: request.principal.projectId
            })
        }
    );

    app.get("/v2/pieces", async () => {
        return await pieceMetadataLoader.manifest();
    });

    app.get(
        "/v2/pieces/:name",
        {
            schema: {
                params: GetPieceRequestParams,
                querystring: GetPieceRequestQuery,
            },
        },
        async (
            request: FastifyRequest<{
                Params: GetPieceRequestParams;
                Querystring: GetPieceRequestQuery;
            }>,
        ) => {
            const { name } = request.params;
            const { version } = request.query;
            return await pieceMetadataLoader.pieceMetadata(name, version);
        },
    );
};
