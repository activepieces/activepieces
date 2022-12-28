import {FastifyInstance, FastifyPluginOptions, FastifyRequest} from "fastify"
import {ActivepiecesError, ErrorCode} from "../helper/activepieces-error";
import {PieceOptionRequest, PieceOptionRequestSchema} from "shared";
import {getPiece, pieces} from "pieces/dist/src/apps";
import {DropdownProperty, PropertyType} from "pieces/dist/src/framework/property/prop.model";


export const piecesController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    fastify.get('/v1/pieces', async (_request, _reply) => {
        return pieces.map(f => f.metadata());
    })

    fastify.post('/v1/pieces/:pieceName/options', {
        schema: PieceOptionRequestSchema
    }, async (request: FastifyRequest<{
        Params: { pieceName: string },
        Body: PieceOptionRequest,
    }>, _reply) => {
        const component = getPiece(request.params.pieceName);
        if (component === undefined) {
            throw new ActivepiecesError({
                code: ErrorCode.PIECE_NOT_FOUND,
                params: {
                    pieceName: request.params.pieceName
                }
            });
        }
        const action = component.getAction(request.body.stepName);
        const trigger = component.getTrigger(request.body.stepName);
        if (action === undefined && trigger === undefined) {
            throw new ActivepiecesError({
                code: ErrorCode.STEP_NOT_FOUND,
                params: {
                    stepName: request.body.stepName,
                    pieceName: request.params.pieceName
                }
            });
        }
        const configs = action !== undefined ? action.props : trigger!.props;
        const config = configs.find((f: { name: string; }) => f.name === request.body.configName);
        if (config === undefined || config.type !== PropertyType.DROPDOWN) {
            throw new ActivepiecesError({
                code: ErrorCode.CONFIG_NOT_FOUND,
                params: {
                    stepName: request.body.stepName,
                    pieceName: request.params.pieceName,
                    configName: request.body.configName
                }
            });
        }
        return await (config as DropdownProperty<unknown>).options(request.body.configs);
    })
};

