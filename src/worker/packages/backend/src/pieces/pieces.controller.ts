import {FastifyInstance, FastifyPluginOptions, FastifyRequest} from "fastify"
import {ActivepiecesError, ErrorCode} from "../helper/activepieces-error";
import {SelectInput} from "pieces/dist/src/framework/config/select-input.model";
import {InputType} from "pieces";
import {pieces, getPiece} from "pieces";
import {PieceOptionRequest, PieceOptionRequestSchema} from "shared";


export const piecesController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    fastify.get('/v1/pieces', async (_request, _reply) => {
        return pieces.map(f => f.metadata());
    })

    fastify.post('/v1/pieces/:pieceName/options', {
        schema: PieceOptionRequestSchema
    }, async (_request: FastifyRequest<{
        Params: { pieceName: string },
        Body: PieceOptionRequest,
    }>, _reply) => {
        const component = getPiece(_request.params.pieceName);
        if (component === undefined) {
            throw new ActivepiecesError({
                code: ErrorCode.PIECE_NOT_FOUND,
                params: {
                    pieceName: _request.params.pieceName
                }
            });
        }
        const action = component.getAction(_request.body.stepName);
        const trigger = component.getTrigger(_request.body.stepName);
        if (action === undefined && trigger === undefined) {
            throw new ActivepiecesError({
                code: ErrorCode.STEP_NOT_FOUND,
                params: {
                    stepName: _request.body.stepName,
                    pieceName: _request.params.pieceName
                }
            });
        }
        const configs = action !== undefined ? action.configs : trigger!.configs;
        const config = configs.find(f => f.name === _request.body.configName);
        if (config === undefined || config.type !== InputType.SELECT) {
            throw new ActivepiecesError({
                code: ErrorCode.CONFIG_NOT_FOUND,
                params: {
                    stepName: _request.body.stepName,
                    pieceName: _request.params.pieceName,
                    configName: _request.body.configName
                }
            });
        }
        return await (config as SelectInput).options(_request.body.configs);
    })
};

