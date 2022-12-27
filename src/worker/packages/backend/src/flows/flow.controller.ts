import {FastifyInstance, FastifyPluginOptions, FastifyRequest} from "fastify"
import {
    CreateFlowRequest,
    CreateFlowRequestSchema,
    FlowId,
    FlowVersionId,
    ListFlowsRequest,
    ListFlowsSchema,
    FlowOperationRequest
} from "shared";
import {StatusCodes} from "http-status-codes";
import {ActivepiecesError, ErrorCode} from "../helper/activepieces-error";
import {flowService} from "./flow-service";

export const flowController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {

    fastify.post('/', {
        schema: CreateFlowRequestSchema
    }, async (_request: FastifyRequest<{
        Body: CreateFlowRequest
    }>, _reply) => {
        return await flowService.create(_request.body);
    })


    // TODO ADD VALIDATION
    fastify.post('/:flowId', {}, async (_request: FastifyRequest<{
        Params: {
            flowId: FlowId
        },
        Body: FlowOperationRequest
    }>, _reply) => {
        let flow = await flowService.getOne(_request.params.flowId, undefined);
        if (flow === null) {
            throw new ActivepiecesError({code: ErrorCode.FLOW_NOT_FOUND, params: {id: _request.params.flowId}});
        }
        return await flowService.update(_request.params.flowId, _request.body);
    })


    fastify.get('/', {
        schema: ListFlowsSchema
    }, async (_request: FastifyRequest<{
        Querystring: ListFlowsRequest
    }>, _reply) => {
        return await flowService.list(_request.query.collectionId, _request.query.cursor, _request.query.limit);
    })


    fastify.get('/:flowId', async (_request: FastifyRequest<{
        Params: {
            flowId: FlowId
        },
        Querystring: {
            versionId: FlowVersionId | undefined
        }
    }>, _reply) => {
        const versionId: FlowVersionId | undefined = _request.query.versionId;
        let flow = await flowService.getOne(_request.params.flowId, versionId);
        if (flow === null) {
            throw new ActivepiecesError({code: ErrorCode.FLOW_NOT_FOUND, params: {id: _request.params.flowId}});
        }
        return flow;
    })


    fastify.delete('/:flowId', async (_request: FastifyRequest<{
        Params: {
            flowId: FlowId
        }
    }>, _reply) => {
        await flowService.delete(_request.params.flowId);
        _reply.status(StatusCodes.OK).send();
    })
};

